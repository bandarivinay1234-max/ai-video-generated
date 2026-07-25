import { VideoProject, Scene } from '../types';
import { BackgroundMusicEngine } from './audioSynth';

export interface RenderProgressCallback {
  (progress: number, currentScene: number, totalScenes: number, statusText: string): void;
}

export class VideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioCtx: AudioContext;
  private project: VideoProject;
  private musicEngine: BackgroundMusicEngine;

  constructor(project: VideoProject, canvasElement?: HTMLCanvasElement) {
    this.project = project;
    this.canvas = canvasElement || document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;

    const width = project.aspectRatio === '9:16' ? 720 : 1280;
    const height = project.aspectRatio === '9:16' ? 1280 : project.aspectRatio === '1:1' ? 1080 : 720;
    
    this.canvas.width = project.aspectRatio === '1:1' ? 1080 : width;
    this.canvas.height = height;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtx();
    this.musicEngine = new BackgroundMusicEngine();
  }

  public async renderAndExportVideo(onProgress?: RenderProgressCallback): Promise<Blob> {
    const scenes = this.project.scenes;
    if (!scenes || scenes.length === 0) {
      throw new Error('No scenes found in project');
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    // 1. Preload image & video assets
    onProgress?.(5, 0, scenes.length, 'Loading AI scene visuals & video clips...');
    const loadedImages: Map<string, HTMLImageElement> = new Map();
    const loadedVideos: Map<string, HTMLVideoElement> = new Map();

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const videoSrc = scene.videoClipUrl || (scene.imageUrl && (scene.imageUrl.startsWith('data:video') || scene.imageUrl.endsWith('.mp4') || scene.imageUrl.endsWith('.webm') || scene.imageUrl.endsWith('.mov')) ? scene.imageUrl : undefined);
      
      if (videoSrc) {
        const vid = document.createElement('video');
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        if (!videoSrc.startsWith('data:')) {
          vid.crossOrigin = 'anonymous';
        }
        vid.src = videoSrc;
        await new Promise((resolve) => {
          vid.onloadeddata = resolve;
          vid.onerror = resolve;
          setTimeout(resolve, 2000); // 2s fallback timeout
        });
        loadedVideos.set(scene.id, vid);
      }

      if (scene.imageUrl) {
        const img = new Image();
        if (!scene.imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = () => {
            // Retry without crossOrigin if CORS prevented loading
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              loadedImages.set(scene.id, fallbackImg);
              resolve(null);
            };
            fallbackImg.onerror = () => resolve(null);
            fallbackImg.src = scene.imageUrl!;
          };
          img.src = scene.imageUrl!;
        });
        if (img.complete && img.naturalWidth > 0) {
          loadedImages.set(scene.id, img);
        }
      }
    }

    // 2. Preload Narration Speech Audio Buffers (Custom Voice or AI TTS)
    onProgress?.(15, 0, scenes.length, 'Preloading narration voice tracks...');
    const audioBuffers: Map<string, AudioBuffer | null> = new Map();
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const voiceSourceUrl = scene.customAudioUrl || scene.audioUrl;
      if (voiceSourceUrl) {
        try {
          const res = await fetch(voiceSourceUrl);
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
          audioBuffers.set(scene.id, audioBuffer);
        } catch (e) {
          console.warn(`Failed to decode audio for scene ${i + 1}:`, e);
          audioBuffers.set(scene.id, null);
        }
      }
    }

    // 3. Setup Audio Destination & Canvas Stream for Recording
    const canvasStream = this.canvas.captureStream(30); // 30 FPS
    const audioDestination = this.audioCtx.createMediaStreamDestination();

    // Combined stream
    const combinedTracks = [
      ...canvasStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks(),
    ];
    const combinedStream = new MediaStream(combinedTracks);

    // MediaRecorder options
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 5000000, // 5 Mbps
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const recordPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };
      mediaRecorder.onerror = (e) => reject(e);
    });

    mediaRecorder.start();

    // 4. Start Background Music Synthesis if configured
    this.musicEngine.start(this.project.musicGenre, 0.12);

    // 5. Render Scenes sequentially to Canvas
    const width = this.canvas.width;
    const height = this.canvas.height;

    let totalProjectDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0);
    let elapsedTime = 0;

    for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
      const scene = scenes[sceneIdx];
      const img = loadedImages.get(scene.id);
      const vid = loadedVideos.get(scene.id);
      const audioBuffer = audioBuffers.get(scene.id);
      const sceneDuration = scene.durationSeconds || 4;

      // Play scene voice narration audio
      if (audioBuffer) {
        const source = this.audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioDestination);
        source.connect(this.audioCtx.destination);
        source.start(this.audioCtx.currentTime);
      }

      const fps = 30;
      const totalFrames = Math.ceil(sceneDuration * fps);

      for (let frame = 0; frame < totalFrames; frame++) {
        const frameTime = frame / fps;
        const progressInScene = frameTime / sceneDuration;

        // Draw Scene Visual with Motion (Ken Burns Effect) or Video frame
        this.ctx.fillStyle = '#0f172a'; // dark background fill
        this.ctx.fillRect(0, 0, width, height);

        if (vid && vid.readyState >= 2) {
          try {
            vid.currentTime = frameTime % (vid.duration || 10);
            this.drawVideoFrame(vid, width, height);
          } catch {
            if (img && img.complete && img.naturalWidth > 0) {
              this.drawKenBurnsImage(img, width, height, progressInScene, scene.transition);
            }
          }
        } else if (img && img.complete && img.naturalWidth > 0) {
          this.drawKenBurnsImage(img, width, height, progressInScene, scene.transition);
        } else {
          // Placeholder gradient background if image missing
          const grad = this.ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(1, '#311042');
          this.ctx.fillStyle = grad;
          this.ctx.fillRect(0, 0, width, height);
        }

        // Apply Transition Effects
        if (progressInScene < 0.15 && scene.transition === 'fade') {
          this.ctx.fillStyle = `rgba(0,0,0,${1 - progressInScene / 0.15})`;
          this.ctx.fillRect(0, 0, width, height);
        }

        // Draw Subtitles Overlay
        if (this.project.subtitleEnabled && scene.scriptText) {
          this.drawSubtitles(scene, frameTime, width, height);
        }

        // Draw Scene Watermark / Style Tag
        this.drawStyleOverlay(this.project.style, width, height, progressInScene);

        // Advance timing report
        elapsedTime += 1 / fps;
        const overallProgress = Math.min(95, 20 + Math.floor((elapsedTime / totalProjectDuration) * 75));
        onProgress?.(overallProgress, sceneIdx + 1, scenes.length, `Rendering Scene ${sceneIdx + 1}/${scenes.length}...`);

        // Wait for next frame pacing
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }
    }

    // Stop recording & music engine
    this.musicEngine.stop();
    onProgress?.(98, scenes.length, scenes.length, 'Finalizing video file...');
    mediaRecorder.stop();

    return recordPromise;
  }

  private drawVideoFrame(vid: HTMLVideoElement, width: number, height: number) {
    this.ctx.save();
    const vidW = vid.videoWidth || 1280;
    const vidH = vid.videoHeight || 720;
    const vidAspect = vidW / vidH;
    const canvasAspect = width / height;

    let renderW = width;
    let renderH = height;

    if (vidAspect > canvasAspect) {
      renderW = height * vidAspect;
    } else {
      renderH = width / vidAspect;
    }

    this.ctx.drawImage(vid, width / 2 - renderW / 2, height / 2 - renderH / 2, renderW, renderH);
    this.ctx.restore();
  }

  private drawKenBurnsImage(
    img: HTMLImageElement,
    width: number,
    height: number,
    progress: number,
    transition: string
  ) {
    const scale = 1 + progress * 0.08; // subtle 8% zoom
    const panX = (progress - 0.5) * 20;
    const panY = (progress - 0.5) * 15;

    this.ctx.save();
    this.ctx.translate(width / 2 + panX, height / 2 + panY);
    this.ctx.scale(scale, scale);

    // Maintain aspect fill
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let renderW = width;
    let renderH = height;

    if (imgAspect > canvasAspect) {
      renderW = height * imgAspect;
    } else {
      renderH = width / imgAspect;
    }

    this.ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    this.ctx.restore();
  }

  private drawSubtitles(scene: Scene, frameTime: number, width: number, height: number) {
    // Determine active text snippet
    let activeText = scene.scriptText;
    if (scene.subtitles && scene.subtitles.length > 0) {
      const activeSub = scene.subtitles.find(
        (s) => frameTime >= s.startTime && frameTime <= s.endTime
      );
      if (activeSub) {
        activeText = activeSub.text;
      }
    }

    if (!activeText) return;

    this.ctx.save();

    // Style
    const fontSize = width < 800 ? 24 : 32;
    this.ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const paddingX = 24;
    const paddingY = 12;
    const textWidth = this.ctx.measureText(activeText).width;
    const boxWidth = Math.min(width - 60, textWidth + paddingX * 2);
    const boxHeight = fontSize + paddingY * 2;
    const posY = height - boxHeight - 40;

    // Background pill
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.beginPath();
    this.ctx.roundRect(width / 2 - boxWidth / 2, posY - boxHeight / 2, boxWidth, boxHeight, 12);
    this.ctx.fill();

    // Text stroke & fill
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#000000';
    this.ctx.strokeText(activeText, width / 2, posY);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(activeText, width / 2, posY);

    this.ctx.restore();
  }

  private drawStyleOverlay(style: string, width: number, height: number, progressInScene: number = 0) {
    this.ctx.save();
    
    // Character cast overlay if present
    if (this.project.characterNames) {
      this.ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      const castText = `🎭 Cast: ${this.project.characterNames}`;
      const metrics = this.ctx.measureText(castText);
      const bgW = metrics.width + 20;
      
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      this.ctx.beginPath();
      this.ctx.roundRect(width - bgW - 20, 20, bgW, 26, 8);
      this.ctx.fill();

      this.ctx.fillStyle = '#f43f5e'; // Vibrant pink/red accent dot
      this.ctx.beginPath();
      this.ctx.arc(width - bgW - 10, 33, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(castText, width - bgW - 10, 37);
    }

    // Cartoon Sparkles or Motion Lines for 2d-cartoon, anime, motion-comic
    if (['2d-cartoon', 'anime', 'motion-comic'].includes(style)) {
      // Dynamic Floating Cartoon Particles
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const px = ((i * 137 + progressInScene * 300) % width);
        const py = ((i * 219 + Math.sin(progressInScene * 5 + i) * 80) % height);
        const radius = (i % 3) + 2;

        this.ctx.fillStyle = i % 2 === 0 ? 'rgba(251, 191, 36, 0.6)' : 'rgba(168, 85, 247, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(px, py, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Style Watermark Badge
    this.ctx.font = '600 11px sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillText(`✨ AI Studio Animation • ${style.toUpperCase()}`, 20, 30);
    this.ctx.restore();
  }
}
