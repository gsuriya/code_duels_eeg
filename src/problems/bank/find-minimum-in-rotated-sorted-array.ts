/**
 * src/problems/bank/find-minimum-in-rotated-sorted-array.ts
 */
import { Problem } from '../problemTypes';

const findMinRotated: Problem = {
  id: 'find-minimum-in-rotated-sorted-array',
  title: 'Find Minimum in Rotated Sorted Array',
  difficulty: 'medium',
  description: `Suppose an array of length n sorted in ascending order is rotated
between 1 and n times. Given the sorted rotated array nums of unique elements,
return the minimum element of this array.`,
  starterCode: {
    python: `class Solution:
    def findMin(self, nums):
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

Solution.prototype.findMin = function (nums) {
  // Your code here
};`,
    java: `class Solution {
    public int findMin(int[] nums) {
        // Your code here
        return 0;
    }
}`
  },
  functionSignature: {
    name: 'findMin',
    params: [{ name: 'nums', type: 'number[]' }],
    returnType: 'number'
  },
  testCases: [
    {
      id: 1,
      input: { nums: [3, 4, 5, 1, 2] },
      expectedOutput: 1,
      isExample: true,
      explanation: 'Original array [1,2,3,4,5] rotated 3 times.'
    },
    {
      id: 2,
      input: { nums: [4, 5, 6, 7, 0, 1, 2] },
      expectedOutput: 0,
      isExample: true,
      explanation: 'Original array [0,1,2,4,5,6,7] rotated 4 times.'
    },
    {
      id: 3,
      input: { nums: [11, 13, 15, 17] },
      expectedOutput: 11,
      isExample: true,
      explanation: 'Array rotated a full cycle.'
    },
    { id: 4, input: { nums: [1] }, expectedOutput: 1, isExample: false },
    { id: 5, input: { nums: [2, 1] }, expectedOutput: 1, isExample: false }
  ],
  constraints: [
    'n == nums.length',
    '1 <= n <= 5000',
    'All integers are unique.',
    'nums is sorted and rotated between 1 and n times.'
  ]
};

export default findMinRotated;
