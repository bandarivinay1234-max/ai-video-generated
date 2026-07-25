import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  Share2,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles,
  Film,
  Check,
  Copy,
  Layers,
} from 'lucide-react';
import { VideoProject } from '../types';

interface VideoPlayerViewProps {
  project: VideoProject;
  videoBlobUrl: string | null;
  onReRender?: () => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  project,
  videoBlobUrl,
  onReRender,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [videoBlobUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && duration > 0) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleDownload = () => {
    if (!videoBlobUrl) return;
    const a = document.createElement('a');
    a.href = videoBlobUrl;
    a.download = `${project.title || 'ai-video'}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timeInSec: number) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 mb-8 text-white">
      
      {/* Player Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {project.style} • {project.aspectRatio}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {project.musicGenre} Music
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            {project.title || 'Generated AI Video'}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {onReRender && (
            <button
              onClick={onReRender}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Re-render canvas video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Re-render</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!videoBlobUrl}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/30 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Video</span>
          </button>
        </div>
      </div>

      {/* Embedded Video Display Screen */}
      <div className="relative group w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center max-h-[550px] aspect-video">
        {videoBlobUrl ? (
          <video
            ref={videoRef}
            src={videoBlobUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />
        ) : (
          <div className="text-center p-8 text-slate-500">
            <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Video file preparing for display...</p>
          </div>
        )}

        {/* Big Center Play Overlay Button */}
        {videoBlobUrl && !isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl backdrop-blur-xs transition transform hover:scale-105"
          >
            <Play className="w-8 h-8 fill-white ml-1" />
          </button>
        )}
      </div>

      {/* Video Controls Bar */}
      {videoBlobUrl && (
        <div className="mt-4 space-y-2">
          {/* Timeline Seekbar */}
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={handleFullScreen}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Script & Voice Summary */}
      <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
        <div>
          <span className="font-bold text-slate-300 block mb-1">Enhanced Concept Prompt</span>
          <p className="italic leading-relaxed">{project.enhancedPrompt || project.prompt}</p>
        </div>
        <div>
          <span className="font-bold text-slate-300 block mb-1">Audio Narration & Voice</span>
          <p>
            Narrator Voice: <strong className="text-white">{project.voice}</strong>
          </p>
          <p>
            Subtitles: <strong className="text-white">{project.subtitleEnabled ? 'Enabled' : 'Disabled'}</strong>
          </p>
        </div>
      </div>

    </div>
  );
};
