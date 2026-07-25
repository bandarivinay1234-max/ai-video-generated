import React, { useState, useRef } from 'react';
import { Scene } from '../types';
import { Layers, Film, Mic, Volume2, Clock, Shuffle, RefreshCw, Upload, Plus, Trash2, Image as ImageIcon, Sparkles, Link as LinkIcon, Square, Play, Pause, Radio, FileAudio, Check, X } from 'lucide-react';

interface SceneBreakdownEditorProps {
  scenes: Scene[];
  onUpdateScenes: (updated: Scene[]) => void;
  onRegenerateVisual?: (sceneIndex: number) => void;
  voice: string;
}

export const SceneBreakdownEditor: React.FC<SceneBreakdownEditorProps> = ({
  scenes,
  onUpdateScenes,
  onRegenerateVisual,
  voice,
}) => {
  const [playingAudioIdx, setPlayingAudioIdx] = useState<number | null>(null);
  const [loadingAudioIdx, setLoadingAudioIdx] = useState<number | null>(null);
  const [urlInputIdx, setUrlInputIdx] = useState<number | null>(null);
  const [customUrl, setCustomUrl] = useState<string>('');

  // Voice recording state
  const [recordingSceneIdx, setRecordingSceneIdx] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const audioFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<any>(null);

  if (!scenes) return null;

  // Start microphone recording for a scene voiceover
  const handleStartRecording = async (index: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          const audioUrl = e.target?.result as string;
          if (audioUrl) {
            const updated = [...scenes];
            updated[index] = { ...updated[index], customAudioUrl: audioUrl };
            onUpdateScenes(updated);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingSceneIdx(index);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or unsupported in this browser.');
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingSceneIdx(null);
    setRecordingTime(0);
  };

  // Upload custom audio file for scene voiceover
  const handleAudioFileUpload = (index: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const updated = [...scenes];
        updated[index] = { ...updated[index], customAudioUrl: result };
        onUpdateScenes(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  // Play audio preview (either custom voice or TTS)
  const handlePlayAudioPreview = (index: number, audioSrc?: string) => {
    if (!audioSrc) return;
    setPlayingAudioIdx(index);
    const audio = new Audio(audioSrc);
    audio.onended = () => setPlayingAudioIdx(null);
    audio.onerror = () => setPlayingAudioIdx(null);
    audio.play().catch(() => setPlayingAudioIdx(null));
  };

  // Clear custom recorded/uploaded voice
  const handleClearCustomAudio = (index: number) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], customAudioUrl: undefined };
    onUpdateScenes(updated);
  };

  const handleTextChange = (index: number, field: keyof Scene, value: any) => {
    const updated = [...scenes];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateScenes(updated);
  };

  // Upload custom media file (Video MP4/WebM or Image JPG/PNG/GIF/WebP)
  const handleMediaFileUpload = (index: number, file: File) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.mov');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const updated = [...scenes];
        if (isVideo) {
          updated[index] = { ...updated[index], videoClipUrl: result, imageUrl: result };
        } else {
          updated[index] = { ...updated[index], imageUrl: result, videoClipUrl: undefined };
        }
        onUpdateScenes(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  // Set custom image/video URL
  const handleSetCustomUrl = (index: number) => {
    if (!customUrl.trim()) return;
    const url = customUrl.trim();
    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.startsWith('data:video');
    const updated = [...scenes];
    if (isVideo) {
      updated[index] = { ...updated[index], videoClipUrl: url, imageUrl: url };
    } else {
      updated[index] = { ...updated[index], imageUrl: url, videoClipUrl: undefined };
    }
    onUpdateScenes(updated);
    setUrlInputIdx(null);
    setCustomUrl('');
  };

  // Add a brand new scene with custom image
  const handleAddCustomScene = () => {
    const newSceneNumber = scenes.length + 1;
    const newScene: Scene = {
      id: 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      sceneNumber: newSceneNumber,
      scriptText: `Scene ${newSceneNumber} description and voiceover narration.`,
      visualPrompt: `Detailed visual description for scene ${newSceneNumber}`,
      durationSeconds: 4,
      transition: 'fade',
      imageUrl: 'https://picsum.photos/seed/' + Math.floor(Math.random() * 10000) + '/1280/720',
      subtitles: [
        { text: `Scene ${newSceneNumber} narration.`, startTime: 0, endTime: 3.5 }
      ]
    };
    onUpdateScenes([...scenes, newScene]);
  };

  // Delete scene
  const handleDeleteScene = (index: number) => {
    if (scenes.length <= 1) {
      alert('Your video project must contain at least 1 scene.');
      return;
    }
    const updated = scenes.filter((_, idx) => idx !== index).map((s, idx) => ({
      ...s,
      sceneNumber: idx + 1
    }));
    onUpdateScenes(updated);
  };

  const handleTestTTS = async (index: number, text: string) => {
    if (!text.trim()) return;
    setLoadingAudioIdx(index);
    try {
      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        setPlayingAudioIdx(index);
        audio.onended = () => setPlayingAudioIdx(null);
        await audio.play();

        const updated = [...scenes];
        updated[index].audioUrl = data.audioUrl;
        onUpdateScenes(updated);
      }
    } catch (err) {
      console.error('TTS preview error:', err);
    } finally {
      setLoadingAudioIdx(null);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 sm:p-8 mb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Storyboard & Scene Breakdown ({scenes.length} Scenes)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize voiceover scripts, motion transitions, or upload custom image assets
            </p>
          </div>
        </div>

        {/* Add Scene / Image Button */}
        <button
          type="button"
          onClick={handleAddCustomScene}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Scene with Image</span>
        </button>
      </div>

      {/* Scene Cards */}
      <div className="space-y-4">
        {scenes.map((scene, idx) => (
          <div
            key={scene.id || idx}
            className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-600 text-white w-fit">
                  Scene {scene.sceneNumber || idx + 1}
                </span>
                {scene.imageUrl?.endsWith('.gif') || scene.imageUrl?.startsWith('data:image/gif') ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Animated GIF
                  </span>
                ) : null}
                {scene.isPresenterScene ? (
                  <span
                    title={scene.presenterError || undefined}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 cursor-help"
                  >
                    AI Presenter {scene.presenterStatus === 'generating' ? '(generating...)' : scene.presenterStatus === 'failed' ? '(failed - hover for reason)' : ''}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <select
                    value={scene.durationSeconds || 4}
                    onChange={(e) =>
                      handleTextChange(idx, 'durationSeconds', parseInt(e.target.value))
                    }
                    className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {[3, 4, 5, 6, 7, 8, 10].map((d) => (
                      <option key={d} value={d}>
                        {d}s duration
                      </option>
                    ))}
                  </select>
                </span>

                <span className="flex items-center space-x-1">
                  <Shuffle className="w-3.5 h-3.5 text-purple-500" />
                  <select
                    value={scene.transition || 'fade'}
                    onChange={(e) => handleTextChange(idx, 'transition', e.target.value)}
                    className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none capitalize"
                  >
                    {['fade', 'zoom-in', 'slide-left', 'dissolve', 'pan'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </span>

                {/* Delete Scene Button */}
                {scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteScene(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete scene"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Image Preview Box & Controls */}
              <div className="lg:col-span-4 flex flex-col space-y-2">
                <div className="relative group rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-video flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  {scene.videoClipUrl || (scene.imageUrl && (scene.imageUrl.startsWith('data:video') || scene.imageUrl.endsWith('.mp4') || scene.imageUrl.endsWith('.webm'))) ? (
                    <video
                      src={scene.videoClipUrl || scene.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : scene.imageUrl ? (
                    <img
                      src={scene.imageUrl}
                      alt={`Scene ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400">
                      <Film className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[11px]">Visual generating...</span>
                    </div>
                  )}

                  {/* Top Overlay Buttons */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                    {onRegenerateVisual && (
                      <button
                        type="button"
                        onClick={() => onRegenerateVisual(idx)}
                        className="p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-indigo-600 transition"
                        title="Regenerate AI image visual"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Media Action Buttons */}
                <div className="flex items-center justify-between gap-1">
                  <input
                    type="file"
                    accept="image/*,video/*,.mp4,.webm,.mov,.gif,.png,.jpg,.jpeg,.webp"
                    ref={(el) => (fileInputRefs.current[idx] = el)}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaFileUpload(idx, file);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image/Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrlInputIdx(urlInputIdx === idx ? null : idx)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] transition"
                    title="Paste Image URL"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Paste URL Input Drawer */}
                {urlInputIdx === idx && (
                  <div className="flex items-center space-x-1.5 p-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 p-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSetCustomUrl(idx)}
                      className="px-2 py-1 text-[11px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    >
                      Set
                    </button>
                  </div>
                )}
              </div>

              {/* Text Fields */}
              <div className="lg:col-span-8 space-y-3">
                
                {/* Script Voiceover */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <Mic className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Voiceover Narration & Recording</span>
                    </label>

                    {/* Audio Option Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Hidden audio file upload input */}
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.ogg"
                        ref={(el) => (audioFileInputRefs.current[idx] = el)}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAudioFileUpload(idx, file);
                        }}
                      />

                      {/* Record My Voice Button */}
                      {recordingSceneIdx === idx ? (
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold animate-pulse shadow-sm"
                        >
                          <Radio className="w-3 h-3 animate-spin" />
                          <span>Stop Recording ({recordingTime}s)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartRecording(idx)}
                          disabled={recordingSceneIdx !== null}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-pink-50 dark:bg-pink-950/80 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800 hover:bg-pink-100 text-[11px] font-bold transition disabled:opacity-50"
                          title="Record your voice narration with microphone"
                        >
                          <Mic className="w-3 h-3" />
                          <span>Record My Voice</span>
                        </button>
                      )}

                      {/* Upload Audio File Button */}
                      <button
                        type="button"
                        onClick={() => audioFileInputRefs.current[idx]?.click()}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-[11px] font-bold transition"
                        title="Upload audio narration MP3/WAV file"
                      >
                        <FileAudio className="w-3 h-3" />
                        <span>Upload Audio</span>
                      </button>

                      {/* TTS Preview Button */}
                      <button
                        type="button"
                        onClick={() => handleTestTTS(idx, scene.scriptText)}
                        disabled={loadingAudioIdx === idx}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-500 hover:underline flex items-center space-x-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>
                          {loadingAudioIdx === idx
                            ? 'Synthesizing...'
                            : playingAudioIdx === idx
                            ? 'Playing...'
                            : 'AI TTS'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Voice Recording / Audio Attached Banner */}
                  {scene.customAudioUrl ? (
                    <div className="mb-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold">🎙️ Custom Recorded/Uploaded Voice Attached</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handlePlayAudioPreview(idx, scene.customAudioUrl)}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Listen Voice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearCustomAudio(idx)}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] hover:bg-red-500 hover:text-white transition"
                          title="Reset to AI TTS voice"
                        >
                          Reset to AI Voice
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <input
                    type="text"
                    value={scene.scriptText}
                    onChange={(e) => handleTextChange(idx, 'scriptText', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Visual Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    AI Visual Prompt & Shot Description
                  </label>
                  <textarea
                    rows={2}
                    value={scene.visualPrompt}
                    onChange={(e) => handleTextChange(idx, 'visualPrompt', e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

