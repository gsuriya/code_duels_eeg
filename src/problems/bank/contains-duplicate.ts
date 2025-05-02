/**
 * src/problems/bank/contains-duplicate.ts
 */
import { Problem } from '../problemTypes';

export const containsDuplicate: Problem = {
  id: 'contains-duplicate',
  title: 'Contains Duplicate',
  difficulty: 'easy',
  description: `Given an integer array nums, return true if any value appears at least
twice in the array, and return false if every element is distinct.`,
  starterCode: {
    python: `class Solution:
    def containsDuplicate(self, nums):
        \"\"\"
        :type nums: List[int]
        :rtype: bool
        \"\"\"
        # Your code here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var Solution = function () {};

Solution.prototype.containsDuplicate = function (nums) {
  // Your code here
};`,
    java: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Your code here
        return false;
    }
}`
  },
  functionSignature: {
    name: 'containsDuplicate',
    params: [{ name: 'nums', type: 'number[]' }],
    returnType: 'boolean'
  },
  testCases: [
    { id: 1, input: { nums: [1, 2, 3, 1] }, expectedOutput: true, isExample: true },
    { id: 2, input: { nums: [1, 2, 3, 4] }, expectedOutput: false, isExample: true },
    {
      id: 3,
      input: { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] },
      expectedOutput: true,
      isExample: true
    },
    { id: 4, input: { nums: [0] }, expectedOutput: false, isExample: false },
    { id: 5, input: { nums: [0, 0] }, expectedOutput: true, isExample: false }
  ],
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^9 <= nums[i] <= 10^9'
  ]
};

export default containsDuplicate;
