export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestCase {
    id: number;
    input: any;
    expectedOutput: any;
    isExample?: boolean;
    explanation?: string;
}

export interface Problem {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    starterCode: {
        [key: string]: string;
    };
    functionSignature: {
        name: string;
        params: Array<{
            name: string;
            type: string;
        }>;
        returnType: string;
    };
    testCases: TestCase[];
    constraints?: string[];
} 