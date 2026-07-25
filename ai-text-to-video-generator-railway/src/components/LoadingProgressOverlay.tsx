import React from 'react';
import { Sparkles, Film, Mic, Music, Wand2, Layers } from 'lucide-react';

interface LoadingProgressOverlayProps {
  statusText: string;
  progress: number;
  currentStepIndex: number;
}

export const LoadingProgressOverlay: React.FC<LoadingProgressOverlayProps> = ({
  statusText,
  progress,
  currentStepIndex,
}) => {
  const steps = [
    { label: 'Enhancing Prompt', icon: Wand2 },
    { label: 'AI Scene Visuals', icon: Film },
    { label: 'TTS Narration', icon: Mic },
    { label: 'Audio Synth & Subtitles', icon: Music },
    { label: 'Canvas Video Render', icon: Layers },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-white">
        
        {/* Animated Glow Halo */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-spin blur-md opacity-75"></div>
          <div className="relative w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>

        {/* Status Text & Percentage */}
        <h3 className="text-lg font-bold text-white mb-1">{statusText}</h3>
        <p className="text-xs text-slate-400 mb-6">
          AI director is synthesizing your storyboards, voiceovers, and soundtrack...
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 mb-6 p-0.5 border border-slate-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-6">
          <span>{progress}% Completed</span>
          <span>Rendering Scene Audio & Frames</span>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-5 gap-2 pt-4 border-t border-slate-800">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition ${
                    isDone
                      ? 'bg-indigo-600 text-white'
                      : isCurrent
                      ? 'bg-purple-500 text-white animate-bounce'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-medium leading-tight text-center ${
                    isCurrent ? 'text-indigo-400 font-bold' : isDone ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
