/**
 * src/problems/bank/search-in-rotated-sorted-array.ts
 */
import { Problem } from '../problemTypes';

const searchRotated: Problem = {
  id: 'search-in-rotated-sorted-array',
  title: 'Search in Rotated Sorted Array',
  difficulty: 'medium',
  description: `Given the array nums after a possible rotation and an integer target,
return the index of target if it is in nums, or -1 if it is not. Algorithm
must run in O(log n) time.`,
  starterCode: {
    python: `class Solution:
    def search(self, nums, target):
        \"\"\"
        :type nums: List[int]
        :type target: int
        :rtype: int
        \"\"\"
        # Your code here
        pass`,
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var Solution = function () {};

Solution.prototype.search = function (nums, target) {
  // Your code here
};`,
    java: `class Solution {
    public int search(int[] nums, int target) {
        // Your code here
        return -1;
    }
}`
  },
  functionSignature: {
    name: 'search',
    params: [
      { name: 'nums', type: 'number[]' },
      { name: 'target', type: 'number' }
    ],
    returnType: 'number'
  },
  testCases: [
    {
      id: 1,
      input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 },
      expectedOutput: 4,
      isExample: true
    },
    {
      id: 2,
      input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 },
      expectedOutput: -1,
      isExample: true
    },
    { id: 3, input: { nums: [1], target: 0 }, expectedOutput: -1, isExample: true },
    { id: 4, input: { nums: [5, 1, 3], target: 3 }, expectedOutput: 2, isExample: false },
    { id: 5, input: { nums: [3, 1], target: 1 }, expectedOutput: 1, isExample: false }
  ],
  constraints: [
    '1 <= nums.length <= 5000',
    'All values are unique.',
    '-10^4 <= nums[i], target <= 10^4'
  ]
};

export default searchRotated;
