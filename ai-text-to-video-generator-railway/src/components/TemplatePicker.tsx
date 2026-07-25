import React, { useState } from 'react';
import { Sparkles, BookOpen, GraduationCap, Megaphone, Share2, Layers } from 'lucide-react';
import { PROMPT_TEMPLATES } from '../data/templates';
import { PromptTemplate, VideoCategory } from '../types';

interface TemplatePickerProps {
  onSelectTemplate: (template: PromptTemplate) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Templates', icon: Layers },
    { id: 'storytelling', label: 'Storytelling', icon: BookOpen },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'advertisement', label: 'Ads & Commercials', icon: Megaphone },
    { id: 'social-media', label: 'Social Shorts', icon: Share2 },
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? PROMPT_TEMPLATES
    : PROMPT_TEMPLATES.filter((t) => t.category === selectedCategory);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Prompt Starter Templates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a pre-designed prompt for instant AI video generation
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-4 cursor-pointer transition shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {template.category}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {template.aspectRatio}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition mb-1">
                {template.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {template.description}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium capitalize">
                {template.style} • {template.musicGenre}
              </span>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition">
                Use →
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
