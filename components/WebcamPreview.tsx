'use client';

import { useEffect, useRef, useState } from 'react';

import * as faceapi from '@vladmandic/face-api';

interface WebcamPreviewProps {
  stream: MediaStream | null;
  onEmotionUpdate?: (emotions: any) => void;
}

export function WebcamPreview({ stream, onEmotionUpdate }: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        setModelsLoaded(true);
      } catch (err) {
        console.error("FaceAPI models failed to load", err);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    
    if (!modelsLoaded) return;

    const interval = setInterval(async () => {
       if (videoRef.current && !videoRef.current.paused) {
          try {
             const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
             if (detections && onEmotionUpdate) {
                onEmotionUpdate(detections.expressions);
             }
          } catch(e) {
             // Ignore transient tracking errors
          }
       }
    }, 1500);

    return () => clearInterval(interval);
  }, [stream, modelsLoaded, onEmotionUpdate]);

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
