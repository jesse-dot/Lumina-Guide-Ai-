import React, { useState } from 'react';
import { validateContribution } from '../services/geminiService';

interface Props {
  onBack: () => void;
}

const ContributionView: React.FC<Props> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [anecdote, setAnecdote] = useState('');
  const [status, setStatus] = useState<'idle' | 'reviewing' | 'approved' | 'rejected'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('reviewing');
    try {
      const result = await validateContribution(name, anecdote);
      setStatus(result.approved ? 'approved' : 'rejected');
      setFeedback(result.feedback);
    } catch {
      setStatus('idle'); // simplistic error handling
    }
  };

  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(74,222,128,0.2)]">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Contribution Accepted!</h2>
        <p className="text-gray-400 mb-10 max-w-sm">{feedback}</p>
        <button onClick={onBack} className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="mr-4 p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">Share Your Story</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto w-full flex-1 flex flex-col">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Landmark Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
            placeholder="e.g. Eiffel Tower"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Your Anecdote or Fact</label>
          <textarea 
            required
            value={anecdote}
            onChange={(e) => setAnecdote(e.target.value)}
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all resize-none"
            placeholder="Share something interesting that others might not know..."
          />
        </div>
        
        <div className="mt-2">
           <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Photo (Optional)</label>
           <div className="border-2 border-dashed border-white/10 rounded-xl h-32 flex flex-col items-center justify-center text-gray-500 hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer relative">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
             </svg>
             <span className="text-sm">Click to upload</span>
             <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
           </div>
        </div>

        {status === 'rejected' && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm animate-shake">
            <strong>Submission Rejected:</strong> {feedback}
          </div>
        )}

        <div className="mt-auto pb-6">
          <button 
            type="submit" 
            disabled={status === 'reviewing'}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              status === 'reviewing' 
                ? 'bg-gray-700 text-gray-400 cursor-wait' 
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/20 hover:scale-[1.02]'
            }`}
          >
            {status === 'reviewing' ? 'AI Reviewing...' : 'Submit Contribution'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ContributionView;