import { Problem } from './problemTypes';

export const easyProblems: Problem[] = [
    {
        id: 'hello-world',
        title: 'Hello World',
        description: 'Write a function that returns the string "Hello, World!".\n\nThis is a simple problem to test the Judge0 integration.',
        difficulty: 'easy',
        starterCode: {
            python: 'def hello_world():\n    # Your code here\n    pass',
            javascript: 'function helloWorld() {\n    // Your code here\n}',
            java: 'class Solution {\n    public String helloWorld() {\n        // Your code here\n        return "";\n    }\n}'
        },
        functionSignature: {
            name: 'helloWorld',
            params: [],
            returnType: 'string'
        },
        testCases: [
            {
                id: 1,
                input: {},
                expectedOutput: 'Hello, World!',
                isExample: true,
                explanation: 'The function should return the string "Hello, World!"'
            }
        ],
        constraints: [
            'The function must return exactly the string "Hello, World!"',
            'No input parameters are required'
        ]
    }
]; 