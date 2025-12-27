
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { UploadedImage, TransitionStyle, VideoPacing } from "../types";

export class GeminiService {
  private static async getAI() {
    // Re-creating instance ensures we use the latest injected API key
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Analyzes a sequence of images and generates a detailed prompt for Veo.
   */
  static async analyzeImagesAndGeneratePrompt(
    images: UploadedImage[],
    userInstruction: string,
    transitionStyle: TransitionStyle,
    pacing: VideoPacing
  ): Promise<string> {
    const ai = await this.getAI();
    const model = 'gemini-3-flash-preview';

    const imageParts = images.map(img => ({
      inlineData: {
        data: img.data.split(',')[1],
        mimeType: img.mimeType
      }
    }));

    const transitionDescription = {
      none: "direct transitions",
      fade: "soft fades to black between key frames",
      dissolve: "smooth cross-dissolve transitions",
      zoom: "dynamic camera zooms transitioning between scenes",
      pan: "seamless cinematic pans connecting the visuals",
      cut: "sharp, rhythmic cuts between images",
      morph: "fluid AI morphing and liquid transitions"
    }[transitionStyle];

    const pacingDescription = {
      slow: "lingering, meditative pacing",
      normal: "balanced cinematic flow",
      fast: "energetic and rapid movement",
      rhythmic: "timed to a clear beat with consistent intervals"
    }[pacing];

    const prompt = `
      I have a sequence of ${images.length} images uploaded in order. 
      Please analyze the context, characters, setting, and movement between these images.
      
      User's Priority Instructions: "${userInstruction || "Create a cinematic transition through these images."}"
      
      TECHNICAL REQUIREMENTS:
      - Transition Style: ${transitionDescription}
      - Pacing: ${pacingDescription}
      
      Based on the images and technical requirements, write a single, detailed cinematic prompt for a video generator (Veo). 
      The prompt MUST explicitly describe how the camera moves and how the scene transitions from one image's content to the next using the requested "${transitionStyle}" style and "${pacing}" pace.
      
      Only return the final prompt text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        systemInstruction: "You are an expert film director and AI prompt engineer. Your goal is to synthesize multiple images into a single cohesive video generation prompt with specific focus on transition aesthetics."
      }
    });

    return response.text || "A cinematic animation following the sequence of images.";
  }

  /**
   * Generates a video using Veo 3.1 Fast.
   */
  static async generateVideo(
    images: UploadedImage[],
    finalPrompt: string,
    aspectRatio: '16:9' | '9:16'
  ): Promise<string> {
    const ai = await this.getAI();
    
    const startImage = images[0];
    const lastImage = images[images.length - 1];

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: finalPrompt,
      image: {
        imageBytes: startImage.data.split(',')[1],
        mimeType: startImage.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio,
        lastFrame: {
          imageBytes: lastImage.data.split(',')[1],
          mimeType: lastImage.mimeType,
        },
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed: No download link.");

    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  /**
   * Edits an image using Gemini 2.5 Flash Image.
   */
  static async editImage(
    base64Image: string,
    mimeType: string,
    prompt: string
  ): Promise<string> {
    const ai = await this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image was generated.");
  }
}
