import React, { useState, useCallback } from 'react';
import CameraView from './components/CameraView';
import ProcessingOverlay from './components/ProcessingOverlay';
import ResultView from './components/ResultView';
import ItineraryPlanner from './components/ItineraryPlanner';
import ContributionView from './components/ContributionView';
import { AppState, TourResult, ProcessingStep } from './types';
import { identifyLandmark, getLandmarkDetails, generateNarration } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<TourResult | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const startProcess = useCallback(async (imageSrc: string) => {
    setAppState(AppState.PROCESSING);
    setProcessingSteps([
      { label: 'Identifying landmark...', status: 'active' },
      { label: 'Searching history...', status: 'pending' },
      { label: 'Synthesizing narration...', status: 'pending' }
    ]);

    try {
      // Step 1: Identify
      const landmarkName = await identifyLandmark(imageSrc);
      
      setProcessingSteps(prev => [
        { label: `Identified: ${landmarkName}`, status: 'completed' },
        { label: 'Searching history...', status: 'active' },
        { label: 'Synthesizing narration...', status: 'pending' }
      ]);

      // Step 2: Get Details (Grounding)
      const { text, sources } = await getLandmarkDetails(landmarkName);
      
      setProcessingSteps(prev => [
        prev[0],
        { label: 'History retrieved', status: 'completed' },
        { label: 'Synthesizing narration...', status: 'active' }
      ]);

      // Step 3: TTS
      const audioBuffer = await generateNarration(text);
      let audioUrl = '';
      if (audioBuffer) {
         const blob = new Blob([audioBuffer], { type: 'audio/wav' }); // TTS output is often WAV-compatible PCM
         audioUrl = URL.createObjectURL(blob);
      }

      setProcessingSteps(prev => [
        prev[0],
        prev[1],
        { label: 'Audio ready', status: 'completed' }
      ]);
      
      // Wait a brief moment for visual completeness
      await new Promise(r => setTimeout(r, 500));

      setResult({
        landmarkName,
        description: text,
        imageUri: imageSrc,
        audioData: audioUrl,
        sources
      });
      setAppState(AppState.RESULT);

    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process the image. Please try again.");
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        startProcess(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans">
      {/* Landing / Idle State */}
      {appState === AppState.IDLE && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
           {/* Animated Background Elements */}
           <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]"></div>

           <div className="relative z-10 text-center max-w-md w-full">
             <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
             </div>
             <h1 className="text-4xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
               Lumina Guide
             </h1>
             <p className="text-white/60 text-lg mb-8">
               Your AI companion for exploring the world.
             </p>

             <div className="space-y-3 w-full">
                <button 
                  onClick={() => setAppState(AppState.CAMERA)}
                  className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  </svg>
                  Identify Landmark
                </button>

                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <button className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    Upload Photo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={() => setAppState(AppState.ITINERARY)}
                    className="py-3 px-4 rounded-xl bg-blue-600/20 text-blue-200 border border-blue-500/30 hover:bg-blue-600/30 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.159.69.159 1.006 0z" />
                    </svg>
                    <span className="text-sm font-semibold">Plan Trip</span>
                  </button>
                  <button 
                    onClick={() => setAppState(AppState.CONTRIBUTE)}
                    className="py-3 px-4 rounded-xl bg-green-600/20 text-green-200 border border-green-500/30 hover:bg-green-600/30 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    <span className="text-sm font-semibold">Contribute</span>
                  </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Camera State */}
      {appState === AppState.CAMERA && (
        <CameraView 
          onCapture={startProcess}
          onClose={() => setAppState(AppState.IDLE)} 
        />
      )}

      {/* Processing State */}
      {appState === AppState.PROCESSING && (
        <ProcessingOverlay steps={processingSteps} />
      )}

      {/* Result State */}
      {appState === AppState.RESULT && result && (
        <ResultView 
          result={result} 
          onReset={() => setAppState(AppState.IDLE)} 
        />
      )}

      {/* Itinerary Planner State */}
      {appState === AppState.ITINERARY && (
        <ItineraryPlanner onBack={() => setAppState(AppState.IDLE)} />
      )}

      {/* Contribution State */}
      {appState === AppState.CONTRIBUTE && (
        <ContributionView onBack={() => setAppState(AppState.IDLE)} />
      )}

      {/* Error State */}
      {appState === AppState.ERROR && (
        <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
           <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008h-.008v-.008z" />
             </svg>
           </div>
           <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
           <p className="text-white/60 mb-6">{errorMsg}</p>
           <button 
            onClick={() => setAppState(AppState.IDLE)}
            className="px-8 py-3 bg-white text-black rounded-full font-bold"
           >
             Try Again
           </button>
        </div>
      )}
    </div>
  );
};

export default App;