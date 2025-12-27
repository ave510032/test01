
import React, { useState, useEffect } from 'react';
import { UploadedImage, AppMode, VideoGenerationState, TransitionStyle, VideoPacing } from './types';
import { GeminiService } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import { 
  Play, 
  Settings, 
  Film, 
  Sparkles, 
  Loader2, 
  Video, 
  Download,
  AlertTriangle,
  Scissors,
  Image as ImageIcon,
  Wind,
  Layers,
  Zap
} from 'lucide-react';

const App: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [instruction, setInstruction] = useState('');
  const [mode, setMode] = useState<AppMode>(AppMode.VIDEO_GENERATOR);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>('morph');
  const [pacing, setPacing] = useState<VideoPacing>('normal');
  
  const [videoState, setVideoState] = useState<VideoGenerationState>({
    isGenerating: false,
    statusMessage: '',
    progress: 0
  });

  const [editPrompt, setEditPrompt] = useState('');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // API Key validation
  const checkApiKey = async () => {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    return true;
  };

  const handleGenerateVideo = async () => {
    if (images.length < 5) {
      alert("Please upload at least 5 images.");
      return;
    }

    try {
      await checkApiKey();
      setVideoState({
        isGenerating: true,
        statusMessage: 'Analyzing visual narrative with Gemini...',
        progress: 10
      });

      // 1. Analyze and get prompt
      const finalPrompt = await GeminiService.analyzeImagesAndGeneratePrompt(
        images, 
        instruction,
        transitionStyle,
        pacing
      );
      
      setVideoState(prev => ({ 
        ...prev, 
        statusMessage: 'Synthesizing cinematic transition with Veo (may take a few minutes)...',
        progress: 30
      }));

      // 2. Generate Video
      const videoUrl = await GeminiService.generateVideo(images, finalPrompt, aspectRatio);
      
      setVideoState({
        isGenerating: false,
        statusMessage: 'Video generated successfully!',
        progress: 100,
        videoUrl
      });
    } catch (error: any) {
      console.error(error);
      setVideoState({
        isGenerating: false,
        statusMessage: `Error: ${error.message || 'Something went wrong'}`,
        progress: 0
      });
      if (error.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      }
    }
  };

  const handleEditImage = async () => {
    if (images.length === 0 || !editPrompt) return;
    
    try {
      setIsEditing(true);
      const firstImage = images[0];
      const result = await GeminiService.editImage(firstImage.data, firstImage.mimeType, editPrompt);
      setEditingImage(result);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              VISIONARY STUDIO
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Veo 3.1 & Gemini 2.5 Powered</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-white/5">
          <button 
            onClick={() => setMode(AppMode.VIDEO_GENERATOR)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === AppMode.VIDEO_GENERATOR ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            Video Animator
          </button>
          <button 
            onClick={() => setMode(AppMode.IMAGE_EDITOR)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === AppMode.IMAGE_EDITOR ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            AI Image Editor
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            className="text-xs text-blue-400 hover:underline hidden lg:block"
          >
            Billing Docs
          </a>
          <button 
            onClick={() => window.aistudio.openSelectKey()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold">Creative Canvas</h2>
            </div>

            {mode === AppMode.VIDEO_GENERATOR ? (
              <>
                <ImageUploader images={images} setImages={setImages} />
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-400">Sequence Instructions</label>
                  <textarea 
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Describe how the scene should evolve... (e.g., 'Cinematic tracking shot through these landscapes with a dreamy filter')"
                    className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder:text-slate-600"
                  />
                </div>

                {/* Transitions Section */}
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers className="w-4 h-4" />
                    <span className="text-sm font-medium">Transition & Pacing</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Style</label>
                      <select 
                        value={transitionStyle}
                        onChange={(e) => setTransitionStyle(e.target.value as TransitionStyle)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="none">None (Direct)</option>
                        <option value="fade">Fade to Black</option>
                        <option value="dissolve">Cross Dissolve</option>
                        <option value="zoom">Dynamic Zoom</option>
                        <option value="pan">Cinematic Pan</option>
                        <option value="cut">Rhythmic Cut</option>
                        <option value="morph">AI Morphing</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Motion Pacing</label>
                      <select 
                        value={pacing}
                        onChange={(e) => setPacing(e.target.value as VideoPacing)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="slow">Slow & Meditative</option>
                        <option value="normal">Balanced Flow</option>
                        <option value="fast">Fast & Energetic</option>
                        <option value="rhythmic">Dynamic Rhythm</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Aspect Ratio</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAspectRatio('16:9')}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${aspectRatio === '16:9' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-700 bg-slate-900/30 text-slate-500'}`}
                    >
                      16:9 Landscape
                    </button>
                    <button 
                      onClick={() => setAspectRatio('9:16')}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${aspectRatio === '9:16' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-700 bg-slate-900/30 text-slate-500'}`}
                    >
                      9:16 Portrait
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    disabled={images.length < 5 || videoState.isGenerating}
                    onClick={handleGenerateVideo}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98]"
                  >
                    {videoState.isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Animate Sequence
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              // IMAGE EDITOR MODE
              <div className="space-y-6">
                <div className="aspect-video w-full rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center relative">
                  {images.length > 0 ? (
                    <img src={images[0].data} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-6">
                      <ImageIcon className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Upload an image to start editing</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-400">Edit Prompt</label>
                  <input 
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., 'Add a vintage polaroid filter' or 'Remove the background'"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button 
                  disabled={images.length === 0 || !editPrompt || isEditing}
                  onClick={handleEditImage}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate Edit
                </button>

                {editingImage && (
                  <div className="space-y-3 pt-4">
                    <label className="text-sm font-medium text-slate-400">Edited Result</label>
                    <div className="aspect-video rounded-xl bg-slate-900 border border-purple-500/30 overflow-hidden">
                      <img src={editingImage} className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Output Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="glass-panel rounded-2xl flex-1 flex flex-col min-h-[500px] overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-slate-900/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2 uppercase tracking-tight">
                <Video className="w-4 h-4 text-blue-400" />
                Live Preview
              </h3>
              {videoState.videoUrl && (
                <a 
                  href={videoState.videoUrl} 
                  download="visionary_output.mp4"
                  className="p-1.5 bg-blue-600/10 text-blue-400 rounded-md hover:bg-blue-600/20 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Studio Export
                </a>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/50 relative">
              {!videoState.isGenerating && !videoState.videoUrl && (
                <div className="text-center space-y-4 max-w-sm opacity-60">
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto ring-4 ring-slate-900/50">
                    <Film className="w-10 h-10 text-slate-700" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-300">No content generated yet</h4>
                    <p className="text-xs text-slate-500">
                      Upload at least 5 images and provide instructions to start the AI video generation process.
                    </p>
                  </div>
                </div>
              )}

              {videoState.isGenerating && (
                <div className="text-center space-y-6 max-w-md w-full">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div 
                      className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium animate-pulse text-blue-100">{videoState.statusMessage}</p>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full transition-all duration-1000" 
                        style={{ width: `${videoState.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Visionary AI is deep-dreaming your sequence. This usually takes 2-4 minutes.
                    </p>
                  </div>
                </div>
              )}

              {videoState.videoUrl && !videoState.isGenerating && (
                <div className="w-full h-full flex items-center justify-center">
                  <video 
                    src={videoState.videoUrl} 
                    controls 
                    className="w-full h-auto max-h-full rounded-xl shadow-2xl shadow-black/50 border border-white/5"
                    autoPlay
                    loop
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-900/50 border-t border-white/5 text-[11px] text-slate-500 flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                Processing Engine: VEO-3.1-FAST
              </span>
              <span className="flex items-center gap-1.5">
                Export Quality: 1080P PRO
              </span>
            </div>
          </section>
        </div>
      </main>

      <footer className="p-6 border-t border-white/5 text-center text-xs text-slate-600">
        <p>© 2024 Visionary Studio AI • Developed by World-Class AI Engineers</p>
      </footer>
    </div>
  );
};

export default App;
