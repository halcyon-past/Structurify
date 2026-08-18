import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import toast from "react-hot-toast";


interface UploadZoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function UploadZone({ file, onFileSelect, isUploading, uploadProgress }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.csv') || selectedFile.name.match(/\.xlsx?$/)) {
      onFileSelect(selectedFile);
    } else {
      toast.error("Only CSV and XLSX files are supported.");
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-6 relative overflow-hidden group flex flex-col h-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 to-blue-500 opacity-50"></div>
      
      <h2 className="text-xl font-bold mb-4 text-gray-100 flex items-center gap-2 flex-shrink-0">
        <span className="bg-accent-500/20 text-accent-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
        Upload Source File
      </h2>
      
      <div 
        data-testid="drop-zone"
        className={`border-2 border-dashed rounded-2xl p-6 flex-1 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
          isDragging 
            ? 'border-accent-400 bg-accent-500/10 scale-[1.02] shadow-[0_0_30px_rgba(139,92,246,0.15)]' 
            : 'border-white/20 hover:border-accent-500/50 hover:bg-white/5'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          data-testid="file-input"
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelection(e.target.files[0]);
            }
          }}
        />
        
        <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center transition-all duration-500 ${isDragging ? 'bg-accent-500/20 animate-pulse-slow' : 'bg-white/5 group-hover:bg-accent-500/10'}`}>
          <UploadCloud size={40} className={`transition-colors duration-300 ${isDragging ? 'text-accent-400' : 'text-gray-400 group-hover:text-accent-300'}`} />
        </div>
        
        {file ? (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <p className="font-semibold text-lg text-gray-100 mb-1">{file.name}</p>
            <p className="text-sm text-accent-400 font-mono bg-accent-500/10 px-3 py-1 rounded-full inline-block">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-medium text-lg text-gray-200 mb-2">Drag & drop your messy spreadsheet here</p>
            <p className="text-sm text-gray-500">Supports <span className="text-gray-400 font-mono">.CSV</span>, <span className="text-gray-400 font-mono">.XLSX</span></p>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="mt-8 bg-black/20 p-4 rounded-xl border border-white/5" data-testid="upload-progress">
          <div className="flex justify-between text-sm mb-3">
            <span className="font-medium text-gray-300 animate-pulse">Encrypting & Uploading to GCS...</span>
            <span className="font-mono text-accent-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-accent-600 to-blue-500 h-full rounded-full transition-all duration-300 relative" 
              style={{ width: `${uploadProgress}%` }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[pulse_1s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
