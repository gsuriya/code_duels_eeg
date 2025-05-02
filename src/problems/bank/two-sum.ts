/**
 * src/problems/bank/two-sum.ts
 */
import { Problem } from '../problemTypes';

export const twoSum: Problem = {
  id: 'two-sum',
  title: 'Two Sum',
  difficulty: 'easy',
  description: `Given an array of integers nums and an integer target, return indices of
the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not
use the same element twice.

You can return the answer in any order.`,
  starterCode: {
    python: `class Solution:
    def twoSum(self, nums, target):
        \"\"\"
        :type nums: List[int]
        :type target: int
        :rtype: List[int]
        \"\"\"
        # Your code here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var Solution = function () {};

Solution.prototype.twoSum = function (nums, target) {
  // Your code here
};`,
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[0];
    }
}`
  },
  functionSignature: {
    name: 'twoSum',
    params: [
      { name: 'nums', type: 'number[]' },
      { name: 'target', type: 'number' }
    ],
    returnType: 'number[]'
  },
  testCases: [
    {
      id: 1,
      input: { nums: [2, 7, 11, 15], target: 9 },
      expectedOutput: [0, 1],
      isExample: true,
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
    },
    {
      id: 2,
      input: { nums: [3, 2, 4], target: 6 },
      expectedOutput: [1, 2],
      isExample: true,
      explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
    },
    {
      id: 3,
      input: { nums: [3, 3], target: 6 },
      expectedOutput: [0, 1],
      isExample: true,
      explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
    },
    {
      id: 4,
      input: { nums: [1, 2, 3, 4, 5], target: 9 },
      expectedOutput: [3, 4],
      isExample: false,
      explanation: 'Because nums[3] + nums[4] == 9, we return [3, 4].'
    },
    {
      id: 5,
      input: { nums: [-1, -2, -3, -4, -5], target: -8 },
      expectedOutput: [2, 4],
      isExample: false,
      explanation: 'Because nums[2] + nums[4] == -8, we return [2, 4].'
    }
  ],
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.'
  ]
};

export default twoSum;