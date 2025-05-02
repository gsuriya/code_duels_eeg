/**
 * src/problems/problemService.ts
 */
import { problems } from './index';
import { Problem } from './problemTypes';
import { runTests, TestResult } from './testRunner';

export const getRandomProblem = (): Problem =>
  problems[Math.floor(Math.random() * problems.length)];

// Add alias for backward compatibility with Battle.tsx
export const getRandomEasyProblem = getRandomProblem;

export const getProblemById = (id: string): Problem => {
  const p = problems.find(p => p.id === id);
  if (!p) throw new Error(`Problem "${id}" not found`);
  return p;
};

/* optional helper that pipes into your existing Judge0 test runner */
export const submitSolution = (
  code: string,
  language: string,
  problemId: string
): Promise<TestResult[]> => {
  const problem = getProblemById(problemId);
  // Provide an empty string as terminal output or fetch it from somewhere if available
  const terminalOutput = '';
  return runTests(problem, code, language, terminalOutput);
};