import React, { useState } from 'react';
import { ItineraryItem } from '../types';
import { generateItinerary } from '../services/geminiService';

interface Props {
  onBack: () => void;
}

const INTERESTS = ['History', 'Art', 'Nature', 'Architecture', 'Food', 'Shopping', 'Photography', 'Hidden Gems'];

const ItineraryPlanner: React.FC<Props> = ({ onBack }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelected(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleGenerate = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const items = await generateItinerary(selected);
      setItinerary(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="mr-4 p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Plan Your Journey</h1>
      </div>

      {!itinerary ? (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full animate-fade-in">
          <p className="text-gray-400 mb-6 text-center">Select your interests to generate a personalized walking tour.</p>
          
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-5 py-2.5 rounded-full border transition-all duration-300 ${
                  selected.includes(interest) 
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                    : 'bg-transparent text-gray-300 border-gray-700 hover:border-gray-500 hover:bg-white/5'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>

          <div className="mt-auto">
             <button
              onClick={handleGenerate}
              disabled={loading || selected.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all duration-300 ${
                loading || selected.length === 0 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-blue-500/30'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generatiing Route...
                </span>
              ) : 'Generate Itinerary'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-10 animate-slide-up">
          <div className="space-y-8 relative pl-8 border-l-2 border-gray-800 ml-4 py-2">
            {itinerary.map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-blue-500 border-4 border-black shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform"></div>
                <div className="glass-panel p-5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{item.stopName}</h3>
                    <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">{item.duration}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setItinerary(null)} 
            className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold border border-white/10 transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

export default ItineraryPlanner;