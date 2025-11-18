import React, { useEffect, useRef, useState } from 'react';
import { TourResult } from '../types';

interface ResultViewProps {
  result: TourResult;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);

  // Initialize Audio Context and Decode Audio Data
  useEffect(() => {
    const initAudio = async () => {
      if (!result.audioData) return;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        setAudioContext(ctx);
        
        // Decode the base64 data (which was converted to ArrayBuffer in service)
        // Wait, the service returns ArrayBuffer directly now.
        // But the type definition in types.ts says audioData?: string for serialization if needed,
        // but we can pass ArrayBuffer if we change the type or cast it.
        // Let's assume result.audioData passed here is the Base64 string or we need to handle the buffer.
        // The App.tsx will likely pass the raw buffer or a Blob URL. 
        // Let's adhere to the type: let's assume we passed a Blob URL for simpler React handling,
        // OR we handle raw decoding here.
        // Let's handle raw decoding if it's a base64 string or buffer.
        
        // NOTE: In App.tsx I will convert the buffer to a Blob URL to pass it easily or keep it in memory.
        // Actually, decoding raw PCM/WAV from the TTS API (which returns valid audio bytes usually wrapped) 
        // The TTS API returns a container format (usually MP3 or WAV inside the bytes) or raw PCM. 
        // The `gemini-2.5-flash-preview-tts` usually returns bytes that can be decoded by decodeAudioData.
        
        // Let's assume `result.audioData` is a Blob Object URL string for simplicity in this component.
        // If it is a blob URL:
        const response = await fetch(result.audioData);
        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);

        // Auto-play on load? Let's wait for user or auto-play.
        // playAudio(ctx, decodedBuffer);
      } catch (e) {
        console.error("Error decoding audio", e);
      }
    };

    initAudio();

    return () => {
      audioContext?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.audioData]);

  const playAudio = () => {
    if (!audioContext || !audioBuffer) return;

    if (isPlaying && sourceNode) {
      sourceNode.stop();
      setIsPlaying(false);
      return;
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    setSourceNode(source);
    setIsPlaying(true);
  };

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={result.imageUri} 
          alt="Landmark" 
          className="w-full h-full object-cover opacity-60 blur-sm scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 flex justify-between items-center">
        <button 
          onClick={onReset}
          className="text-white/80 hover:text-white flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:bg-white/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider animate-pulse">
          Live
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-24 overflow-y-auto">
        
        {/* Identified Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
          {result.landmarkName}
        </h1>

        {/* Audio Player Control */}
        <div className="flex items-center gap-4 mb-6 mt-2">
           <button 
            onClick={playAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isPlaying ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white text-black hover:scale-105'
            }`}
           >
             {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
             )}
           </button>
           <span className="text-white/60 text-sm font-medium tracking-wide">
             {isPlaying ? 'Playing Narration...' : 'Listen to Guide'}
           </span>
        </div>

        {/* Description Card */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <p className="text-gray-200 leading-relaxed text-sm md:text-base">
            {result.description}
          </p>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources</h3>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((source, i) => (
                  source.web && (
                    <a 
                      key={i} 
                      href={source.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors truncate max-w-[200px]"
                    >
                      {source.web.title}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultView;