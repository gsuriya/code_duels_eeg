/**
 * src/problems/bank/container-with-most-water.ts
 */
import { Problem } from '../problemTypes';

export const containerWithMostWater: Problem = {
  id: 'container-with-most-water',
  title: 'Container With Most Water',
  difficulty: 'medium',
  description: `Given an integer array height, n vertical lines are drawn such that the
two endpoints of the ith line are (i, 0) and (i, height[i]).
Find two lines that together with the x-axis form a container, such that the
container contains the most water.`,
  starterCode: {
    python: `class Solution:
    def maxArea(self, height):
        \"\"\"
        :type height: List[int]
        :rtype: int
        \"\"\"
        # Your code here
        pass`,
    javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
var Solution = function () {};

Solution.
prototype.maxArea = function (height) {
  // Your code here
};`,
    java: `class Solution {
    public int maxArea(int[] height) {
        // Your code here
        return 0;
    }
}`
  },
  functionSignature: {
    name: 'maxArea',
    params: [{ name: 'height', type: 'number[]' }],
    returnType: 'number'
  },
  testCases: [
    {
      id: 1,
      input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
      expectedOutput: 49,
      isExample: true
    },
    { id: 2, input: { height: [1, 1] }, expectedOutput: 1, isExample: true },
    { id: 3, input: { height: [4, 3, 2, 1, 4] }, expectedOutput: 16, isExample: false },
    { id: 4, input: { height: [1, 2, 1] }, expectedOutput: 2, isExample: false },
    {
      id: 5,
      input: { height: [2, 3, 10, 5, 7, 8, 9] },
      expectedOutput: 36,
      isExample: false
    }
  ],
  constraints: [
    'n == height.length',
    '2 <= n <= 10^5',
    '0 <= height[i] <= 10^4'
  ]
};

export default containerWithMostWater;
