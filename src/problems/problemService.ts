import { Problem } from './problemTypes';
import { easyProblems } from './easyProblems';
import { runTests, TestResult } from './testRunner';

export const getRandomEasyProblem = (): Problem => {
    if (easyProblems.length === 0) {
        throw new Error('No easy problems available.');
    }
    const randomIndex = Math.floor(Math.random() * easyProblems.length);
    return easyProblems[randomIndex];
};

export const getProblemById = (id: string): Problem | undefined => {
    return easyProblems.find(p => p.id === id);
};

export const submitSolution = async (
    problemId: string,
    code: string,
    language: string,
    terminalOutput: string
): Promise<TestResult[]> => {
    const problem = getProblemById(problemId);
    if (!problem) {
        throw new Error(`Problem with id ${problemId} not found`);
    }

    return runTests(problem, code, language, terminalOutput);
}; 