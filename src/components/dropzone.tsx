"use client";

import { useCallback, useState } from "react";
import { Mic, X, UploadCloud, FileAudio } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface Props {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export function AudioDropzone({ onFileSelect, selectedFile, onClear }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      const audioFile = files.find((f) => f.type.startsWith("audio/"));
      if (audioFile) onFileSelect(audioFile);
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (selectedFile) {
    return (
      <div className="rounded-md border border-[#333] bg-[#111] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded bg-[#222]">
            <FileAudio className="w-4 h-4 text-white" />
          </div>
          <div className="truncate">
            <p className="text-[13px] font-medium text-white truncate">{selectedFile.name}</p>
            <p className="text-[11px] text-neutral-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-sm hover:bg-[#333] text-neutral-500 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={clsx(
        "relative rounded-md border border-dashed p-8 text-center transition-colors pb-6 flex flex-col items-center justify-center",
        isDragging ? "border-white bg-[#111]" : "border-[#333] bg-[#050505] hover:bg-[#0a0a0a]"
      )}
    >
      <input
        type="file"
        accept="audio/*"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="mb-4">
         <motion.div 
           animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
           className="w-12 h-12 rounded-full border border-[#222] bg-[#111] flex items-center justify-center m-auto"
         >
           <Mic className={clsx("w-5 h-5", isDragging ? "text-white" : "text-neutral-500")} />
         </motion.div>
      </div>
      <p className="text-[13px] font-medium text-white mb-1">
        {isDragging ? "Drop audio here" : "Click or drag audio"}
      </p>
      <p className="text-[11px] text-neutral-500">MP3, WAV, M4A up to 20MB</p>
    </div>
  );
}
