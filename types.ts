
export interface UploadedImage {
  id: string;
  data: string; // Base64
  name: string;
  mimeType: string;
}

export enum AppMode {
  VIDEO_GENERATOR = 'VIDEO_GENERATOR',
  IMAGE_EDITOR = 'IMAGE_EDITOR'
}

export type TransitionStyle = 'none' | 'fade' | 'dissolve' | 'zoom' | 'pan' | 'cut' | 'morph';
export type VideoPacing = 'slow' | 'normal' | 'fast' | 'rhythmic';

export interface VideoSettings {
  transitionStyle: TransitionStyle;
  pacing: VideoPacing;
  aspectRatio: '16:9' | '9:16';
}

export interface VideoGenerationState {
  isGenerating: boolean;
  statusMessage: string;
  progress: number;
  videoUrl?: string;
}

/**
 * Defining AIStudio interface to ensure global compatibility and fix redeclaration errors.
 */
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Added readonly modifier to align with environment-injected property definitions
    readonly aistudio: AIStudio;
  }
}