/**
 * src/problems/bank/maximum-product-subarray.ts
 */
import { Problem } from '../problemTypes';

const maximumProductSubarray: Problem = {
  id: 'maximum-product-subarray',
  title: 'Maximum Product Subarray',
  difficulty: 'medium',
  description: `Given an integer array nums, find a subarray that has the largest
product, and return the product.`,
  starterCode: {
    python: `class Solution:
    def maxProduct(self, nums):
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

Solution.prototype.maxProduct = function (nums) {
  // Your code here
};`,
    java: `class Solution {
    public int maxProduct(int[] nums) {
        // Your code here
        return 0;
    }
}`
  },
  functionSignature: {
    name: 'maxProduct',
    params: [{ name: 'nums', type: 'number[]' }],
    returnType: 'number'
  },
  testCases: [
    {
      id: 1,
      input: { nums: [2, 3, -2, 4] },
      expectedOutput: 6,
      isExample: true,
      explanation: 'The subarray [2,3] has the largest product 6.'
    },
    {
      id: 2,
      input: { nums: [-2, 0, -1] },
      expectedOutput: 0,
      isExample: true,
      explanation:
        'The result cannot be 2 because [-2,-1] is not a contiguous subarray.'
    },
    { id: 3, input: { nums: [-2] }, expectedOutput: -2, isExample: false },
    { id: 4, input: { nums: [0, 2] }, expectedOutput: 2, isExample: false },
    {
      id: 5,
      input: { nums: [2, -5, -2, -4, 3] },
      expectedOutput: 24,
      isExample: false
    }
  ],
  constraints: [
    '1 <= nums.length <= 2 * 10^4',
    '-10 <= nums[i] <= 10',
    'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.'
  ]
};

export default maximumProductSubarray;
