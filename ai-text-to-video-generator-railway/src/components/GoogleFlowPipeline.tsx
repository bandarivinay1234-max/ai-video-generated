import React from 'react';
import { Sparkles, Film, Mic, Video, Clock, Youtube, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { TargetDuration } from '../types';

interface GoogleFlowPipelineProps {
  targetDuration: TargetDuration;
  setTargetDuration: (dur: TargetDuration) => void;
  currentStepIndex?: number;
  isGenerating?: boolean;
}

export const GoogleFlowPipeline: React.FC<GoogleFlowPipelineProps> = ({
  targetDuration,
  setTargetDuration,
  currentStepIndex = -1,
  isGenerating = false,
}) => {
  const durationOptions: { id: TargetDuration; label: string; sub: string; badge: string }[] = [
    { id: '30s', label: '30s', sub: '3-4 Scenes', badge: 'Teaser' },
    { id: '60s', label: '1 min', sub: '6-8 Scenes', badge: 'Shorts' },
    { id: '90s', label: '1.5 min', sub: '10-12 Scenes', badge: 'Video' },
    { id: '180s', label: '3 min', sub: '16-20 Scenes', badge: 'Explainer' },
    { id: '300s', label: '5 min', sub: '25-30 Scenes', badge: 'Deep-Dive' },
    { id: '600s', label: '10 min', sub: '40-50 Scenes', badge: 'Special' },
  ];

  const flowNodes = [
    {
      id: 'script',
      title: '1. Gemini Scripting',
      desc: 'YouTube storyboard & prompt expansion',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'visuals',
      title: '2. Frame Synthesis',
      desc: 'AI visual generation & GIF/Upload assets',
      icon: Film,
      color: 'from-indigo-600 to-purple-600',
    },
    {
      id: 'audio',
      title: '3. Speech & Audio',
      desc: 'Gemini Voice narration & synth score',
      icon: Mic,
      color: 'from-purple-600 to-pink-600',
    },
    {
      id: 'render',
      title: '4. YouTube Render',
      desc: 'Full-HD canvas video & subtitles',
      icon: Video,
      color: 'from-pink-500 to-red-500',
    },
  ];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 mb-8 text-white relative overflow-hidden">
      
      {/* Background Accent Gradient */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
            <Youtube className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Google Flow Video Pipeline
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                YouTube AI Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select YouTube video target length to dynamically scale storyboard scenes
            </p>
          </div>
        </div>

        {/* YouTube Duration Selector Bar */}
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {durationOptions.map((opt) => {
            const isSelected = targetDuration === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTargetDuration(opt.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition flex flex-col items-center ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{opt.label}</span>
                </div>
                <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Node Graph Visualization */}
      <div className="pt-5 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {flowNodes.map((node, index) => {
            const Icon = node.icon;
            const isCurrent = isGenerating && currentStepIndex === index;
            const isDone = isGenerating && currentStepIndex > index;

            return (
              <div
                key={node.id}
                className={`relative p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-purple-500 bg-purple-950/30 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/50'
                    : isDone
                    ? 'border-indigo-500/50 bg-indigo-950/20'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${node.color} text-white shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600">NODE 0{index + 1}</span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-100">{node.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{node.desc}</p>

                {index < flowNodes.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20">
                    <ArrowRight className="w-4 h-4 text-slate-700" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
