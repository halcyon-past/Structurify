import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

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
      alert("Only CSV and XLSX files are supported.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-bold mb-4">1. Upload Source File</h2>
      <div 
        data-testid="drop-zone"
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
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
        <UploadCloud size={48} className={`mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        {file ? (
          <div className="text-center">
            <p className="font-semibold text-gray-700">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-medium text-gray-700">Drag & drop your messy spreadsheet here</p>
            <p className="text-sm text-gray-500 mt-1">Supports .CSV, .XLSX</p>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="mt-6" data-testid="upload-progress">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Uploading to GCS...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
