import React from 'react';
import {
  Wand2,
  Play,
  Film,
  Mic,
  Music,
  Ratio,
  Sparkles,
  Layers,
  Settings2,
} from 'lucide-react';
import {
  AspectRatio,
  VideoStyle,
  VideoCategory,
  VoiceVoiceName,
  MusicGenre,
  TargetDuration,
} from '../types';
import { GoogleFlowPipeline } from './GoogleFlowPipeline';
import { CustomImageSection } from './CustomImageSection';

interface PromptInputSectionProps {
  prompt: string;
  setPrompt: (val: string) => void;
  characterNames: string;
  setCharacterNames: (val: string) => void;
  category: VideoCategory;
  setCategory: (val: VideoCategory) => void;
  style: VideoStyle;
  setStyle: (val: VideoStyle) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (val: AspectRatio) => void;
  targetDuration: TargetDuration;
  setTargetDuration: (val: TargetDuration) => void;
  voice: VoiceVoiceName;
  setVoice: (val: VoiceVoiceName) => void;
  musicGenre: MusicGenre;
  setMusicGenre: (val: MusicGenre) => void;
  subtitleEnabled: boolean;
  setSubtitleEnabled: (val: boolean) => void;
  customImages: string[];
  setCustomImages: React.Dispatch<React.SetStateAction<string[]>>;
  onEnhance: () => void;
  onGenerate: () => void;
  isEnhancing: boolean;
  isGenerating: boolean;
  currentStepIndex?: number;
}

export const PromptInputSection: React.FC<PromptInputSectionProps> = ({
  prompt,
  setPrompt,
  characterNames,
  setCharacterNames,
  category,
  setCategory,
  style,
  setStyle,
  aspectRatio,
  setAspectRatio,
  targetDuration,
  setTargetDuration,
  voice,
  setVoice,
  musicGenre,
  setMusicGenre,
  subtitleEnabled,
  setSubtitleEnabled,
  customImages,
  setCustomImages,
  onEnhance,
  onGenerate,
  isEnhancing,
  isGenerating,
  currentStepIndex,
}) => {
  const styles: { id: VideoStyle; label: string }[] = [
    { id: '2d-cartoon', label: '🧸 2D Animated Cartoon' },
    { id: 'anime', label: '🎨 Anime Animation' },
    { id: '3d-render', label: '🧊 3D CGI Animation' },
    { id: 'motion-comic', label: '💥 Motion Comic' },
    { id: 'cinematic', label: '🎬 Cinematic Live Motion' },
    { id: 'cyberpunk', label: '🏙️ Cyberpunk' },
    { id: 'photorealistic', label: '📸 Photorealistic' },
    { id: 'minimalist', label: '✨ Minimalist' },
    { id: 'documentary', label: '📜 Documentary' },
  ];

  const categories: { id: VideoCategory; label: string }[] = [
    { id: 'storytelling', label: 'Storytelling' },
    { id: 'education', label: 'Education' },
    { id: 'advertisement', label: 'Advertisement' },
    { id: 'social-media', label: 'Social Media' },
    { id: 'custom', label: 'Custom Prompt' },
  ];

  const voices: { id: VoiceVoiceName; label: string; desc: string }[] = [
    { id: 'Kore', label: 'Kore', desc: 'Warm & Studio' },
    { id: 'Puck', label: 'Puck', desc: 'Lively & Casual' },
    { id: 'Zephyr', label: 'Zephyr', desc: 'Deep & Energetic' },
    { id: 'Fenrir', label: 'Fenrir', desc: 'Bold & Authoritative' },
    { id: 'Charon', label: 'Charon', desc: 'Calm Narrator' },
  ];

  const musicGenres: { id: MusicGenre; label: string }[] = [
    { id: 'cinematic', label: 'Cinematic Orchestral' },
    { id: 'ambient', label: 'Atmospheric Ambient' },
    { id: 'upbeat', label: 'Upbeat Electronic' },
    { id: 'epic', label: 'Epic Trailer' },
    { id: 'lofi', label: 'Chill Lofi Beats' },
    { id: 'none', label: 'No Music (Speech Only)' },
  ];

  return (
    <div className="w-full mb-8">
      
      {/* Google Flow Pipeline & YouTube Target Duration Header */}
      <GoogleFlowPipeline
        targetDuration={targetDuration}
        setTargetDuration={setTargetDuration}
        currentStepIndex={currentStepIndex}
        isGenerating={isGenerating}
      />

      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 sm:p-8">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Video Category
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  category === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Character & Subject Names Input Box */}
        <div className="mb-4 bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Characters / Cast Names (Optional)</span>
            </label>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Give names to animate specific characters across all video scenes
            </span>
          </div>
          
          <input
            type="text"
            value={characterNames}
            onChange={(e) => setCharacterNames(e.target.value)}
            placeholder="e.g. 'Hero: Alex, Villain: Shadow, AI Assistant: Maya'"
            className="w-full p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Quick Character Presets */}
          <div className="flex items-center space-x-1.5 overflow-x-auto mt-2 pt-1">
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider mr-1">
              Sample Casts:
            </span>
            {[
              'Commander Vance & Robot Maya',
              'Whiskers the Cat & Barnaby',
              'Superhero Leo vs Shadow',
              'Professor Alex & Student Maya',
            ].map((cast) => (
              <button
                key={cast}
                type="button"
                onClick={() => setCharacterNames(cast)}
                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition whitespace-nowrap"
              >
                + {cast}
              </button>
            ))}
          </div>
        </div>

        {/* Main Text Prompt Box */}
        <div className="relative mb-6">
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your YouTube AI video concept in detail... (e.g. 'Complete explainer video on how black holes bend spacetime, with galaxy visuals and dramatic cinematic voiceover...')"
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none leading-relaxed"
          />

          {/* AI Enhance Prompt Button */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            <button
              type="button"
              onClick={onEnhance}
              disabled={isEnhancing || !prompt.trim()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition disabled:opacity-50"
              title="Enhance prompt structure with Gemini LLM director"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance with Gemini'}</span>
            </button>
          </div>
        </div>

        {/* Customization Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          
          {/* Visual Style */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Film className="w-3.5 h-3.5 text-indigo-500" />
              <span>Visual Style</span>
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as VideoStyle)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Ratio className="w-3.5 h-3.5 text-purple-500" />
              <span>Aspect Ratio</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: '16:9', label: '16:9 HD' },
                { id: '9:16', label: '9:16 Shorts' },
                { id: '1:1', label: '1:1 Square' },
              ].map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id as AspectRatio)}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition ${
                    aspectRatio === ar.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {ar.id}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Narration */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Mic className="w-3.5 h-3.5 text-pink-500" />
              <span>Voice Narrator</span>
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoiceVoiceName)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({v.desc})
                </option>
              ))}
            </select>
          </div>

          {/* Background Music */}
          <div>
            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Music className="w-3.5 h-3.5 text-amber-500" />
              <span>Background Music</span>
            </label>
            <select
              value={musicGenre}
              onChange={(e) => setMusicGenre(e.target.value as MusicGenre)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {musicGenres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Custom Images & Media Assets Section */}
        <CustomImageSection
          customImages={customImages}
          setCustomImages={setCustomImages}
        />

        {/* Subtitles Toggle & Main Generate Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
          
          {/* Subtitles checkbox */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={subtitleEnabled}
              onChange={(e) => setSubtitleEnabled(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Auto-generate Subtitles Overlay
            </span>
          </label>

          {/* Main Generate Button */}
          <button
            onClick={onGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isGenerating ? 'Synthesizing Flow...' : 'Generate YouTube Video'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};

