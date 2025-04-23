import { Problem } from './problemTypes';
import { easyProblems } from './easyProblems';

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