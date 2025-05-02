/**
 * src/problems/bank/product-of-array-except-self.ts
 */
import { Problem } from '../problemTypes';

export const productExceptSelf: Problem = {
  id: 'product-of-array-except-self',
  title: 'Product of Array Except Self',
  difficulty: 'medium',
  description: `Given an integer array nums, return an array answer such that answer[i]
is equal to the product of all the elements of nums except nums[i].

You must write an algorithm that runs in O(n) time and without using the
division operation.`,
  starterCode: {
    python: `class Solution:
    def productExceptSelf(self, nums):
        \"\"\"
        :type nums: List[int]
        :rtype: List[int]
        \"\"\"
        # Your code here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
var Solution = function () {};

Solution.prototype.productExceptSelf = function (nums) {
  // Your code here
};`,
    java: `class Solution {
    public int[] productExceptSelf(int[] nums) {
        // Your code here
        return new int[0];
    }
}`
  },
  functionSignature: {
    name: 'productExceptSelf',
    params: [{ name: 'nums', type: 'number[]' }],
    returnType: 'number[]'
  },
  testCases: [
    {
      id: 1,
      input: { nums: [1, 2, 3, 4] },
      expectedOutput: [24, 12, 8, 6],
      isExample: true
    },
    {
      id: 2,
      input: { nums: [-1, 1, 0, -3, 3] },
      expectedOutput: [0, 0, 9, 0, 0],
      isExample: true
    },
    {
      id: 3,
      input: { nums: [1, 1, 1, 1] },
      expectedOutput: [1, 1, 1, 1],
      isExample: false
    },
    { id: 4, input: { nums: [5, 2] }, expectedOutput: [2, 5], isExample: false },
    {
      id: 5,
      input: { nums: [-2, -3, -4, -5] },
      expectedOutput: [-60, -40, -30, -24],
      isExample: false
    }
  ],
  constraints: [
    '2 <= nums.length <= 10^5',
    '-30 <= nums[i] <= 30',
    'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.'
  ]
};

export default productExceptSelf;
