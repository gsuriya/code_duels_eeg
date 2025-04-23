import React, { useState } from 'react';
import { ScrollArea } from '@ui/data/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/layout/tabs';

interface TerminalProps {
  output: Array<{
    content: string;
    type?: 'error' | 'success' | 'info' | 'default';
  }>;
  testResults?: {
    passed: boolean;
    testCasesPassed: number;
    totalTestCases: number;
    details: Array<{
      id: number;
      passed: boolean;
      input: any;
      expected: any;
      output?: any;
      error?: string;
    }>;
  } | null;
  className?: string;
  activeTab?: 'output' | 'testcases';
  setActiveTab?: (tab: 'output' | 'testcases') => void;
}

const Terminal: React.FC<TerminalProps> = ({ output, testResults, className = '', activeTab = 'output', setActiveTab }) => {
  return (
    <div className={`bg-[#1E1E1E] rounded-md overflow-hidden ${className}`}>
      <div className="bg-[#2D2D2D] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-gray-400 text-sm">Terminal</span>
        </div>
        {testResults && (
          <span className="text-sm text-gray-400">
            Passed test cases: {testResults.testCasesPassed} / {testResults.totalTestCases}
          </span>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab?.(value as 'output' | 'testcases')}>
        <TabsList className="bg-[#2D2D2D] border-b border-[#1E1E1E]">
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="testcases">Test Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="m-0">
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
                  No output yet...
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="testcases" className="m-0">
          <ScrollArea className="h-[200px]">
            <div className="p-4 font-mono text-sm space-y-2">
              {testResults ? (
                testResults.details.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded ${
                      result.passed ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold">Case {result.id}</span>
                      <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    {!result.passed && (
                      <>
                        <div className="mt-1">
                          <span className="text-gray-400">Input: </span>
                          <span>{JSON.stringify(result.input)}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-gray-400">Expected: </span>
                          <span>{JSON.stringify(result.expected)}</span>
                        </div>
                        {result.output !== undefined && (
                          <div className="mt-1">
                            <span className="text-gray-400">Got: </span>
                            <span className="text-red-400">{JSON.stringify(result.output)}</span>
                          </div>
                        )}
                        {result.error && (
                          <div className="mt-1 text-red-400">
                            {result.error}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">
                  Run your code to see test results
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Terminal; 