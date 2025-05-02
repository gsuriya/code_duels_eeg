/**
 * src/problems/bank/three-sum.ts
 */
import { Problem } from '../problemTypes';

export const threeSum: Problem = {
  id: '3sum',
  title: '3Sum',
  difficulty: 'medium',
  description: `Given an integer array nums, return all the triplets
[nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k,
and nums[i] + nums[j] + nums[k] == 0.`,
  starterCode: {
    python: `class Solution:
    def threeSum(self, nums):
        \"\"\"
        :type nums: List[int]
        :rtype: List[List[int]]
        \"\"\"
        # Your code here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
var Solution = function () {};

Solution.prototype.threeSum = function (nums) {
  // Your code here
};`,
    java: `import java.util.*;

class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        // Your code here
        return new ArrayList<>();
    }
}`
  },
  functionSignature: {
    name: 'threeSum',
    params: [{ name: 'nums', type: 'number[]' }],
    returnType: 'number[][]'
  },
  testCases: [
    {
      id: 1,
      input: { nums: [-1, 0, 1, 2, -1, -4] },
      expectedOutput: [[-1, -1, 2], [-1, 0, 1]],
      isExample: true,
      explanation: 'Output triplets need to sum to zero and be unique.'
    },
    { id: 2, input: { nums: [0, 1, 1] }, expectedOutput: [], isExample: true },
    { id: 3, input: { nums: [0, 0, 0] }, expectedOutput: [[0, 0, 0]], isExample: true },
    { id: 4, input: { nums: [1, 2, -2, -1] }, expectedOutput: [], isExample: false },
    { id: 5, input: { nums: [-1, 0, 1, 0] }, expectedOutput: [[-1, 0, 1]], isExample: false }
  ],
  constraints: [
    '3 <= nums.length <= 3000',
    '-10^5 <= nums[i] <= 10^5'
  ]
};

export default threeSum;
