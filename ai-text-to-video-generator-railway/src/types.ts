export type TargetDuration = '30s' | '60s' | '90s' | '180s' | '300s' | '600s';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type VideoStyle = 'cinematic' | 'anime' | '2d-cartoon' | '3d-render' | 'motion-comic' | 'photorealistic' | 'cyberpunk' | 'minimalist' | 'documentary';

export type VideoCategory = 'storytelling' | 'education' | 'advertisement' | 'social-media' | 'custom';

export type VoiceVoiceName = 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Charon';

export type MusicGenre = 'cinematic' | 'ambient' | 'upbeat' | 'dramatic' | 'lofi' | 'epic' | 'none';

export type SceneTransition = 'fade' | 'zoom-in' | 'slide-left' | 'dissolve' | 'pan';

export interface SubtitleItem {
  text: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
}

export interface Scene {
  id: string;
  sceneNumber: number;
  scriptText: string;        // Voiceover narration
  visualPrompt: string;      // Visual description for AI video/image generator
  durationSeconds: number;
  transition: SceneTransition;
  imageUrl?: string;         // Base64 or image URL generated for this scene
  videoClipUrl?: string;     // Veo generated clip or motion video clip
  audioUrl?: string;         // Generated TTS speech audio data URL
  customAudioUrl?: string;   // Custom user-recorded or uploaded audio voiceover
  subtitles: SubtitleItem[];
}

export interface VideoProject {
  id: string;
  userId?: string;
  title: string;
  prompt: string;
  enhancedPrompt?: string;
  characterNames?: string;
  aspectRatio: AspectRatio;
  targetDuration?: TargetDuration;
  style: VideoStyle;
  category: VideoCategory;
  voice: VoiceVoiceName;
  musicGenre: MusicGenre;
  subtitleEnabled: boolean;
  scenes: Scene[];
  videoUrl?: string;         // Rendered final video URL or data URI
  thumbnailUrl?: string;
  status: 'draft' | 'idle' | 'enhancing' | 'generating_scenes' | 'synthesizing_audio' | 'rendering_video' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  token?: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: VideoCategory;
  description: string;
  prompt: string;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  musicGenre: MusicGenre;
}
