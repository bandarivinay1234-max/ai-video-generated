import React from 'react';
import { X, Play, Trash2, Film, Clock, Download, Sparkles } from 'lucide-react';
import { VideoProject } from '../types';

interface VideoHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: VideoProject[];
  onSelectVideo: (video: VideoProject) => void;
  onDeleteVideo: (id: string) => void;
}

export const VideoHistoryModal: React.FC<VideoHistoryModalProps> = ({
  isOpen,
  onClose,
  videos,
  onSelectVideo,
  onDeleteVideo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Saved AI Video Projects ({videos.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access and manage your previously generated AI videos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {videos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Film className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No saved videos found</p>
              <p className="text-xs text-slate-500 mt-1">
                Enter a text prompt to generate your first AI video!
              </p>
            </div>
          ) : (
            videos.map((vid) => (
              <div
                key={vid.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
              >
                {/* Thumbnail & Title */}
                <div
                  className="flex items-center space-x-3 cursor-pointer flex-1"
                  onClick={() => {
                    onSelectVideo(vid);
                    onClose();
                  }}
                >
                  <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center group">
                    {vid.thumbnailUrl || (vid.scenes?.[0]?.imageUrl) ? (
                      <img
                        src={vid.thumbnailUrl || vid.scenes?.[0]?.imageUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-6 h-6 text-slate-400" />
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 transition">
                      {vid.title || 'Untitled Video'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {vid.prompt}
                    </p>
                    <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-400">
                      <span className="capitalize font-semibold text-indigo-600 dark:text-indigo-400">
                        {vid.style}
                      </span>
                      <span>•</span>
                      <span>{vid.scenes?.length || 0} Scenes</span>
                      <span>•</span>
                      <span>{new Date(vid.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      onSelectVideo(vid);
                      onClose();
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Watch</span>
                  </button>

                  <button
                    onClick={() => onDeleteVideo(vid.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
