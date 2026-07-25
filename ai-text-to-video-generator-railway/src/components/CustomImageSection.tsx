import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Video, Plus, X, Link as LinkIcon, Sparkles, Check, ImagePlus } from 'lucide-react';

interface CustomImageSectionProps {
  customImages: string[];
  setCustomImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export const CustomImageSection: React.FC<CustomImageSectionProps> = ({
  customImages,
  setCustomImages,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset YouTube visual backgrounds
  const presetImages = [
    { name: 'Space Galaxy', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Neon Alley', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Cyber Studio', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Nature Lake', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80' },
    { name: 'Anime Sunset', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setCustomImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
    setShowUrlForm(false);
  };

  const handleAddPreset = (url: string) => {
    if (customImages.includes(url)) return;
    setCustomImages((prev) => [...prev, url]);
  };

  const handleRemoveImage = (index: number) => {
    setCustomImages((prev) => prev.filter((_, i) => i !== index));
  };

  const isVideoUrl = (url: string) => {
    return url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov');
  };

  return (
    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Video className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Add Custom Video Clips & Image Assets ({customImages.length})
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Upload custom MP4/WebM videos, images, or pick presets to embed directly into storyboard scenes
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*,.mp4,.webm,.mov,.gif"
          multiple
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition text-xs font-bold shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Video / Image Files</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlForm(!showUrlForm)}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Paste Media URL</span>
        </button>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Presets:</span>
          {presetImages.map((preset) => {
            const isAdded = customImages.includes(preset.url);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleAddPreset(preset.url)}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border flex items-center space-x-1 ${
                  isAdded
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-indigo-500'
                }`}
              >
                {isAdded ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* URL Input Form Collapsible */}
      {showUrlForm && (
        <div className="flex items-center space-x-2 mb-4 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste video or image URL (e.g. https://.../video.mp4 or image URL)"
            className="flex-1 p-2 bg-transparent text-xs text-slate-900 dark:text-white outline-none"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
          >
            Add Media
          </button>
        </div>
      )}

      {/* Custom Media Gallery Display */}
      {customImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {customImages.map((mediaUrl, index) => {
            const isVideo = isVideoUrl(mediaUrl);
            return (
              <div
                key={index}
                className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 shadow-sm transition hover:shadow-md"
              >
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={`Custom Asset ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                )}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-sm flex items-center space-x-1">
                  {isVideo ? <Video className="w-2.5 h-2.5 text-indigo-400" /> : <ImageIcon className="w-2.5 h-2.5 text-purple-400" />}
                  <span>Scene #{index + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition opacity-0 group-hover:opacity-100"
                  title="Remove custom media"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center">
          <p className="text-xs text-slate-400">
            No custom media added yet. Click <span className="font-bold text-indigo-500">Upload Video / Image Files</span> or pick preset background visuals above.
          </p>
        </div>
      )}
    </div>
  );
};
