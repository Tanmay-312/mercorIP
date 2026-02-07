'use client';

import { useEffect, useRef } from 'react';

interface WebcamPreviewProps {
  stream: MediaStream | null;
}

export function WebcamPreview({ stream }: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-700">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-500">Camera not available</p>
        </div>
      )}
    </div>
  );
}
