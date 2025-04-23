import React from 'react';
import { ScrollArea } from '@ui/data/scroll-area';

interface TerminalProps {
  output: Array<{
    content: string;
    type?: 'error' | 'success' | 'info' | 'default';
  }>;
  className?: string;
}

const Terminal: React.FC<TerminalProps> = ({ output, className = '' }) => {
  return (
    <div className={`bg-[#1E1E1E] rounded-md overflow-hidden ${className}`}>
      <div className="bg-[#2D2D2D] px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-gray-400 text-sm">Terminal</span>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="p-4 font-mono text-sm space-y-1">
          {output.map((line, index) => (
            <div 
              key={index} 
              className={`${
                line.type === 'error' ? 'text-red-400' :
                line.type === 'success' ? 'text-green-400' :
                line.type === 'info' ? 'text-blue-400' :
                !line.type && line.content === 'Code execution output will appear here...' ? 'text-gray-500 italic' :
                'text-gray-300'
              }`}
            >
              {line.content}
            </div>
          ))}
          {output.length === 0 && (
            <div className="text-gray-500 italic">
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Terminal; 