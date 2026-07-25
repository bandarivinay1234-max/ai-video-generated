import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { TemplatePicker } from './components/TemplatePicker';
import { PromptInputSection } from './components/PromptInputSection';
import { SceneBreakdownEditor } from './components/SceneBreakdownEditor';
import { VideoPlayerView } from './components/VideoPlayerView';
import { VideoHistoryModal } from './components/VideoHistoryModal';
import { LoadingProgressOverlay } from './components/LoadingProgressOverlay';
import { VideoRenderer } from './utils/canvasRenderer';
import {
  VideoProject,
  Scene,
  AspectRatio,
  VideoStyle,
  VideoCategory,
  VoiceVoiceName,
  MusicGenre,
  TargetDuration,
  User,
  PromptTemplate,
} from './types';
import { Sparkles, Film, Play, Layers } from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Video Library state
  const [savedVideos, setSavedVideos] = useState<VideoProject[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Form & Customization State
  const [prompt, setPrompt] = useState<string>(
    'A majestic dragon soaring above futuristic glowing crystal towers at golden hour sunset, atmospheric volumetric clouds, 8k resolution.'
  );
  const [category, setCategory] = useState<VideoCategory>('storytelling');
  const [style, setStyle] = useState<VideoStyle>('2d-cartoon');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [targetDuration, setTargetDuration] = useState<TargetDuration>('90s'); // 1.5 mins YouTube default
  const [characterNames, setCharacterNames] = useState<string>('');
  const [voice, setVoice] = useState<VoiceVoiceName>('Kore');
  const [musicGenre, setMusicGenre] = useState<MusicGenre>('epic');
  const [subtitleEnabled, setSubtitleEnabled] = useState<boolean>(true);
  const [customImages, setCustomImages] = useState<string[]>([]);

  // Storyboard / Generation State
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);

  // Loading & Progress Overlay State
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('Initializing AI video generator...');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // On mount: load theme preference, user auth, and saved video history
  useEffect(() => {
    // Apply initial dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedUserStr = localStorage.getItem('studio_user');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        setCurrentUser(u);
      } catch (e) {}
    }

    fetchVideoHistory();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchVideoHistory = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        setSavedVideos(data);
      }
    } catch (err) {
      console.error('Failed to fetch video history:', err);
    }
  };

  // 1. Template Select Handler
  const handleSelectTemplate = (template: PromptTemplate) => {
    setPrompt(template.prompt);
    setCategory(template.category);
    setStyle(template.style);
    setAspectRatio(template.aspectRatio);
    setMusicGenre(template.musicGenre);
  };

  // 2. Enhance Prompt Handler
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);

    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, category, style, aspectRatio, targetDuration, characterNames }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enhance prompt');

      const project: VideoProject = {
        id: 'proj_' + Date.now(),
        userId: currentUser?.id,
        title: data.title || 'AI Video Project',
        prompt,
        enhancedPrompt: data.enhancedPrompt,
        characterNames,
        aspectRatio,
        targetDuration,
        style,
        category,
        voice,
        musicGenre: (data.musicGenre as MusicGenre) || musicGenre,
        subtitleEnabled,
        scenes: data.scenes || [],
        status: 'draft',
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      setCurrentProject(project);
    } catch (err: any) {
      alert(err.message || 'Enhancement failed');
    } finally {
      setIsEnhancing(false);
    }
  };

  // 3. Main Generate Video Handler
  const handleGenerateVideo = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setProgressPercentage(5);
    setCurrentStepIndex(0);
    setStatusText('Step 1/5: Analyzing prompt & composing YouTube flow script...');

    try {
      // Step 1: Ensure scene breakdown exists
      let project = currentProject;
      if (!project || project.scenes.length === 0) {
        const res = await fetch('/api/enhance-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, category, style, aspectRatio, targetDuration, characterNames }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to analyze script');

        project = {
          id: 'proj_' + Date.now(),
          userId: currentUser?.id,
          title: data.title || 'AI Video Project',
          prompt,
          enhancedPrompt: data.enhancedPrompt,
          characterNames,
          aspectRatio,
          style,
          category,
          voice,
          musicGenre,
          subtitleEnabled,
          scenes: data.scenes || [],
          status: 'generating_scenes',
          progress: 20,
          createdAt: new Date().toISOString(),
        };
        setCurrentProject(project);
      }

      const scenes = [...project.scenes];

      // Map custom uploaded images if present
      if (customImages.length > 0) {
        scenes.forEach((sc, idx) => {
          if (!sc.imageUrl) {
            sc.imageUrl = customImages[idx % customImages.length];
          }
        });
      }

      // Step 2: Generate Scene Visuals for each scene
      setCurrentStepIndex(1);
      for (let i = 0; i < scenes.length; i++) {
        const p = 20 + Math.floor((i / scenes.length) * 25);
        setProgressPercentage(p);
        setStatusText(`Step 2/5: Generating AI visual frame for Scene ${i + 1}/${scenes.length}...`);

        if (!scenes[i].imageUrl) {
          try {
            const res = await fetch('/api/generate-scene-visual', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                visualPrompt: scenes[i].visualPrompt,
                style,
                aspectRatio,
              }),
            });
            const imgData = await res.json();
            if (imgData.imageUrl) {
              scenes[i].imageUrl = imgData.imageUrl;
            }
          } catch (e) {
            console.warn(`Failed image generation for scene ${i + 1}:`, e);
          }
        }
      }

      // Step 3: Synthesize Speech Voiceover (TTS) for each scene
      setCurrentStepIndex(2);
      for (let i = 0; i < scenes.length; i++) {
        const p = 45 + Math.floor((i / scenes.length) * 20);
        setProgressPercentage(p);
        setStatusText(`Step 3/5: Synthesizing voiceover narration for Scene ${i + 1}/${scenes.length}...`);

        if (!scenes[i].audioUrl && scenes[i].scriptText) {
          try {
            const res = await fetch('/api/generate-tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: scenes[i].scriptText,
                voice,
              }),
            });
            const audioData = await res.json();
            if (audioData.audioUrl) {
              scenes[i].audioUrl = audioData.audioUrl;
            }
          } catch (e) {
            console.warn(`Failed TTS generation for scene ${i + 1}:`, e);
          }
        }
      }

      // Step 4: Render Video with Canvas & Web Audio
      setCurrentStepIndex(3);
      setStatusText('Step 4/5: Composing background music & animated subtitles...');
      const updatedProject: VideoProject = {
        ...project,
        scenes,
        voice,
        style,
        aspectRatio,
        musicGenre,
        subtitleEnabled,
      };

      setCurrentProject(updatedProject);

      setCurrentStepIndex(4);
      setStatusText('Step 5/5: Encoding full-HD video file...');

      const renderer = new VideoRenderer(updatedProject);
      const videoBlob = await renderer.renderAndExportVideo(
        (renderProg, curScene, totalScenes, msg) => {
          setProgressPercentage(renderProg);
          setStatusText(`Step 5/5: ${msg}`);
        }
      );

      const blobUrl = URL.createObjectURL(videoBlob);
      setRenderedBlobUrl(blobUrl);

      // Step 5: Save project to persistent store
      const finalProject: VideoProject = {
        ...updatedProject,
        videoUrl: blobUrl,
        thumbnailUrl: scenes[0]?.imageUrl,
        status: 'completed',
        progress: 100,
      };

      setCurrentProject(finalProject);

      await fetch('/api/videos/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProject),
      });

      fetchVideoHistory();
    } catch (err: any) {
      console.error('Video Generation Error:', err);
      alert(err.message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete Video Project
  const handleDeleteVideo = async (id: string) => {
    try {
      await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      fetchVideoHistory();
      if (currentProject?.id === id) {
        setCurrentProject(null);
        setRenderedBlobUrl(null);
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  // Re-select saved video project
  const handleSelectVideoProject = (project: VideoProject) => {
    setCurrentProject(project);
    setPrompt(project.prompt);
    setStyle(project.style);
    setAspectRatio(project.aspectRatio);
    setVoice(project.voice);
    setMusicGenre(project.musicGenre);
    if (project.videoUrl) {
      setRenderedBlobUrl(project.videoUrl);
    } else {
      setRenderedBlobUrl(null);
    }
  };

  const handleNewProject = () => {
    setCurrentProject(null);
    setRenderedBlobUrl(null);
    setPrompt('A futuristic drone flying through a neon rainy Tokyo alleyway, tracking a hooded figure, cinematic lighting.');
  };

  // Regenerate visual for a specific scene
  const handleRegenerateSceneVisual = async (sceneIndex: number) => {
    if (!currentProject || !currentProject.scenes[sceneIndex]) return;

    try {
      const scene = currentProject.scenes[sceneIndex];
      const res = await fetch('/api/generate-scene-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualPrompt: scene.visualPrompt,
          style,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (data.imageUrl) {
        const updatedScenes = [...currentProject.scenes];
        updatedScenes[sceneIndex] = {
          ...updatedScenes[sceneIndex],
          imageUrl: data.imageUrl,
        };
        setCurrentProject({ ...currentProject, scenes: updatedScenes });
      }
    } catch (err) {
      console.error('Failed to regenerate scene visual:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          localStorage.removeItem('studio_user');
          setCurrentUser(null);
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewProject={handleNewProject}
        videoCount={savedVideos.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Hero Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen AI Video Synthesis Studio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Turn Any Text into a <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Realistic AI Video
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Multi-scene storyboard director with AI speech narration, procedural soundtrack synthesis, camera transitions, and synchronized subtitles.
          </p>
        </div>

        {/* Prompt Templates */}
        <TemplatePicker onSelectTemplate={handleSelectTemplate} />

        {/* Text Prompt & Controls */}
        <PromptInputSection
          prompt={prompt}
          setPrompt={setPrompt}
          characterNames={characterNames}
          setCharacterNames={setCharacterNames}
          category={category}
          setCategory={setCategory}
          style={style}
          setStyle={setStyle}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          targetDuration={targetDuration}
          setTargetDuration={setTargetDuration}
          voice={voice}
          setVoice={setVoice}
          musicGenre={musicGenre}
          setMusicGenre={setMusicGenre}
          subtitleEnabled={subtitleEnabled}
          setSubtitleEnabled={setSubtitleEnabled}
          customImages={customImages}
          setCustomImages={setCustomImages}
          onEnhance={handleEnhancePrompt}
          onGenerate={handleGenerateVideo}
          isEnhancing={isEnhancing}
          isGenerating={isGenerating}
          currentStepIndex={currentStepIndex}
        />

        {/* Rendered Video Player Output View */}
        {renderedBlobUrl && currentProject && (
          <VideoPlayerView
            project={currentProject}
            videoBlobUrl={renderedBlobUrl}
            onReRender={handleGenerateVideo}
          />
        )}

        {/* Scene Breakdown Storyboard Editor */}
        {currentProject && currentProject.scenes?.length > 0 && (
          <SceneBreakdownEditor
            scenes={currentProject.scenes}
            onUpdateScenes={(updatedScenes) =>
              setCurrentProject({ ...currentProject, scenes: updatedScenes })
            }
            onRegenerateVisual={handleRegenerateSceneVisual}
            voice={voice}
          />
        )}

      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setCurrentUser(u)}
      />

      {/* Video History Drawer/Modal */}
      <VideoHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        videos={savedVideos}
        onSelectVideo={handleSelectVideoProject}
        onDeleteVideo={handleDeleteVideo}
      />

      {/* Loading & Progress Overlay */}
      {isGenerating && (
        <LoadingProgressOverlay
          statusText={statusText}
          progress={progressPercentage}
          currentStepIndex={currentStepIndex}
        />
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-500">
        <p>AI Studio Text-to-Video Engine • Powered by Gemini 3.6 Flash & Veo</p>
      </footer>

    </div>
  );
}
