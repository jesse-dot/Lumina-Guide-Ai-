import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setHasPermission(false);
        setError("Camera access denied. Please upload a photo instead.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden bg-gray-900">
        {hasPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Initializing camera...
          </div>
        )}
        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 px-6 text-center">
            {error}
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay Grid for 'Scanning' Vibe */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
      </div>

      {/* Controls */}
      <div className="h-32 bg-black/80 backdrop-blur-lg flex items-center justify-around pb-4">
        <button 
          onClick={onClose}
          className="p-4 text-white/70 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={takePhoto}
          className="w-20 h-20 rounded-full border-4 border-white bg-white/20 flex items-center justify-center active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-white"></div>
        </button>

        <div className="w-12 h-12"></div> {/* Spacer for balance */}
      </div>
    </div>
  );
};

export default CameraView;