import { Problem, TestCase } from './problemTypes';

export interface TestResult {
    testCase: TestCase;
    passed: boolean;
    actualOutput: any;
    error?: string;
}

export const runTests = async (
    problem: Problem,
    code: string,
    language: string,
    terminalOutput: string
): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    for (const testCase of problem.testCases) {
        try {
            // Parse the output from the terminal
            let actualOutput;
            try {
                // Try to parse the output as JSON
                actualOutput = JSON.parse(terminalOutput);
            } catch (e) {
                // If not JSON, use the raw output
                actualOutput = terminalOutput;
            }
            
            // Compare the actual output with expected output
            const passed = compareOutputs(actualOutput, testCase.expectedOutput);
            
            results.push({
                testCase,
                passed,
                actualOutput
            });
        } catch (error) {
            results.push({
                testCase,
                passed: false,
                actualOutput: null,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
    }

    return results;
};

const compareOutputs = (actual: any, expected: any): boolean => {
    // For arrays, we need to compare elements regardless of order
    if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        
        // Sort both arrays to compare regardless of order
        const sortedActual = [...actual].sort();
        const sortedExpected = [...expected].sort();
        
        return sortedActual.every((val, index) => val === sortedExpected[index]);
    }
    
    // For other types, use strict equality
    return actual === expected;
}; 