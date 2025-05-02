/**
 * src/problems/bank/maximum-subarray.ts
 */
import { Problem } from '../problemTypes';

const maximumSubarray: Problem = {
  id: 'maximum-subarray',
  title: 'Maximum Subarray',
  difficulty: 'medium',
  description: `Given an integer array nums, find the subarray with the largest sum, and
return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
  starterCode: {
    python: `class Solution:
    def maxSubArray(self, nums):
        \"\"\"
        :type nums: List[int]
        :rtype: int
        \"\"\"
        # Your code here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var Solution = function () {};

Solution.prototype.maxSubArray = function (nums) {
  // Your code here
};`,
    java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Your code here
        return 0;
    }
}`
  },
  functionSignature: {
    name: 'maxSubArray',
    params: [{ name: 'nums', type: 'number[]' }],
    returnType: 'number'
  },
  testCases: [
    {
      id: 1,
      input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
      expectedOutput: 6,
      isExample: true,
      explanation: 'The subarray [4,-1,2,1] has the largest sum 6.'
    },
    { id: 2, input: { nums: [1] }, expectedOutput: 1, isExample: true },
    {
      id: 3,
      input: { nums: [5, 4, -1, 7, 8] },
      expectedOutput: 23,
      isExample: true
    },
    { id: 4, input: { nums: [-1] }, expectedOutput: -1, isExample: false },
    { id: 5, input: { nums: [-2, -1] }, expectedOutput: -1, isExample: false }
  ],
  constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4']
};

export default maximumSubarray;
