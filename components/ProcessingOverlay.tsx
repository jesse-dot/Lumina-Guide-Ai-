import React from 'react';
import { ProcessingStep } from '../types';

interface ProcessingOverlayProps {
  steps: ProcessingStep[];
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ steps }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xs">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Analyzing Scene</h2>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 
                ${step.status === 'completed' ? 'border-green-500 bg-green-500' : 
                  step.status === 'active' ? 'border-blue-500 animate-pulse' : 'border-gray-700'}`}>
                {step.status === 'completed' && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-lg ${
                step.status === 'completed' ? 'text-white' :
                step.status === 'active' ? 'text-blue-400 font-semibold' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;