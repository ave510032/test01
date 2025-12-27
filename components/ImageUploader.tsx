
import React from 'react';
import { UploadedImage } from '../types';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, setImages }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        data: base64,
        name: file.name,
        mimeType: file.type
      });
    }

    setImages(prev => [...prev, ...newImages].slice(0, 40));
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          Uploaded Sequence ({images.length}/40)
        </h3>
        {images.length > 0 && (
          <button 
            onClick={() => setImages([])}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((img, idx) => (
          <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
            <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => removeImage(img.id)}
                className="bg-red-500 p-1.5 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] px-1 py-0.5 truncate">
              {idx + 1}. {img.name}
            </div>
          </div>
        ))}

        {images.length < 40 && (
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all">
            <Upload className="w-6 h-6 text-slate-400 mb-2" />
            <span className="text-xs text-slate-400">Add Images</span>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </label>
        )}
      </div>
      
      {images.length > 0 && images.length < 5 && (
        <p className="text-amber-400 text-xs italic">
          Upload at least 5 images to create a story sequence.
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
