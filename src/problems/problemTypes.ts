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
    difficulty: 'easy' | 'medium' | 'hard';
    description: string;
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