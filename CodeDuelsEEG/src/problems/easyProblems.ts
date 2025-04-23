import { Problem } from './problemTypes';

export const easyProblems: Problem[] = [
    {
        id: 'two-sum',
        title: 'Two Sum',
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def twoSum(self, nums, target):
        """
        :type nums: List[int]
        :type target: int
        :rtype: List[int]
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var Solution = function() {};

Solution.prototype.twoSum = function(nums, target) {
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
    },
    {
        id: 'valid-parentheses',
        title: 'Valid Parentheses',
        description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def isValid(self, s):
        """
        :type s: str
        :rtype: bool
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var Solution = function() {};

Solution.prototype.isValid = function(s) {
    // Your code here
};`,
            java: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        // Your code here
        return false;
    }
}`
        },
        functionSignature: {
            name: 'isValid',
            params: [{ name: 's', type: 'string' }],
            returnType: 'boolean'
        },
        testCases: [
            { id: 1, input: { s: "()" }, expectedOutput: true, isExample: true },
            { id: 2, input: { s: "()[]{}" }, expectedOutput: true, isExample: true },
            { id: 3, input: { s: "(]" }, expectedOutput: false, isExample: true },
            { id: 4, input: { s: "([)]" }, expectedOutput: false, isExample: false },
            { id: 5, input: { s: "{[]}" }, expectedOutput: true, isExample: false }
        ],
        constraints: [
            '1 <= s.length <= 10^4',
            's consists of parentheses only \'()[]{}\'.'
        ]
    },
    {
        id: 'palindrome-number',
        title: 'Palindrome Number',
        description: `Given an integer x, return true if x is a palindrome, and false otherwise.

A palindrome is a number that reads the same backward as forward.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def isPalindrome(self, x):
        """
        :type x: int
        :rtype: bool
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
var Solution = function() {};

Solution.prototype.isPalindrome = function(x) {
    // Your code here
};`,
            java: `class Solution {
    public boolean isPalindrome(int x) {
        // Your code here
        return false;
    }
}`
        },
        functionSignature: {
            name: 'isPalindrome',
            params: [{ name: 'x', type: 'number' }],
            returnType: 'boolean'
        },
        testCases: [
            { id: 1, input: { x: 121 }, expectedOutput: true, isExample: true, explanation: '121 reads as 121 from left to right and from right to left.' },
            { id: 2, input: { x: -121 }, expectedOutput: false, isExample: true, explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.' },
            { id: 3, input: { x: 10 }, expectedOutput: false, isExample: true, explanation: 'Reads 01 from right to left. Therefore it is not a palindrome.' },
            { id: 4, input: { x: 12321 }, expectedOutput: true, isExample: false },
            { id: 5, input: { x: 1001 }, expectedOutput: true, isExample: false }
        ],
        constraints: [
            '-2^31 <= x <= 2^31 - 1'
        ]
    },
    {
        id: 'roman-to-integer',
        title: 'Roman to Integer',
        description: `Roman numerals are represented by seven different symbols: I, V, X, L, C, D and M.

Symbol       Value
I            1
V            5
X            10
L            50
C            100
D            500
M            1000

For example, 2 is written as II in Roman numeral, just two ones added together. 12 is written as XII, which is simply X + II. The number 27 is written as XXVII, which is XX + V + II.

Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not IIII. Instead, the number four is written as IV. Because the one is before the five we subtract it making four. The same principle applies to the number nine, which is written as IX. There are six instances where subtraction is used:

- I can be placed before V (5) and X (10) to make 4 and 9. 
- X can be placed before L (50) and C (100) to make 40 and 90. 
- C can be placed before D (500) and M (1000) to make 400 and 900.

Given a Roman numeral, convert it to an integer.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def romanToInt(self, s):
        """
        :type s: str
        :rtype: int
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {string} s
 * @return {number}
 */
var Solution = function() {};

Solution.prototype.romanToInt = function(s) {
    // Your code here
};`,
            java: `class Solution {
    public int romanToInt(String s) {
        // Your code here
        return 0;
    }
}`
        },
        functionSignature: {
            name: 'romanToInt',
            params: [{ name: 's', type: 'string' }],
            returnType: 'number'
        },
        testCases: [
            { id: 1, input: { s: "III" }, expectedOutput: 3, isExample: true },
            { id: 2, input: { s: "LVIII" }, expectedOutput: 58, isExample: true, explanation: 'L = 50, V = 5, III = 3.' },
            { id: 3, input: { s: "MCMXCIV" }, expectedOutput: 1994, isExample: true, explanation: 'M = 1000, CM = 900, XC = 90 and IV = 4.' },
            { id: 4, input: { s: "IX" }, expectedOutput: 9, isExample: false },
            { id: 5, input: { s: "DCXXI" }, expectedOutput: 621, isExample: false }
        ],
        constraints: [
            '1 <= s.length <= 15',
            's contains only the characters (\'I\', \'V\', \'X\', \'L\', \'C\', \'D\', \'M\').',
            'It is guaranteed that s is a valid roman numeral in the range [1, 3999].'
        ]
    },
    {
        id: 'longest-common-prefix',
        title: 'Longest Common Prefix',
        description: `Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string "".`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def longestCommonPrefix(self, strs):
        """
        :type strs: List[str]
        :rtype: str
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {string[]} strs
 * @return {string}
 */
var Solution = function() {};

Solution.prototype.longestCommonPrefix = function(strs) {
    // Your code here
};`,
            java: `class Solution {
    public String longestCommonPrefix(String[] strs) {
        // Your code here
        return "";
    }
}`
        },
        functionSignature: {
            name: 'longestCommonPrefix',
            params: [{ name: 'strs', type: 'string[]' }],
            returnType: 'string'
        },
        testCases: [
            { id: 1, input: { strs: ["flower", "flow", "flight"] }, expectedOutput: "fl", isExample: true },
            { id: 2, input: { strs: ["dog", "racecar", "car"] }, expectedOutput: "", isExample: true, explanation: 'There is no common prefix among the input strings.' },
            { id: 3, input: { strs: ["a"] }, expectedOutput: "a", isExample: false },
            { id: 4, input: { strs: ["", "b"] }, expectedOutput: "", isExample: false },
            { id: 5, input: { strs: ["ab", "a"] }, expectedOutput: "a", isExample: false }
        ],
        constraints: [
            '1 <= strs.length <= 200',
            '0 <= strs[i].length <= 200',
            'strs[i] consists of only lowercase English letters.'
        ]
    },
    {
        id: 'search-insert-position',
        title: 'Search Insert Position',
        description: `Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.

You must write an algorithm with O(log n) runtime complexity.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def searchInsert(self, nums, target):
        """
        :type nums: List[int]
        :type target: int
        :rtype: int
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var Solution = function() {};

Solution.prototype.searchInsert = function(nums, target) {
    // Your code here
};`,
            java: `class Solution {
    public int searchInsert(int[] nums, int target) {
        // Your code here
        return 0;
    }
}`
        },
        functionSignature: {
            name: 'searchInsert',
            params: [
                { name: 'nums', type: 'number[]' },
                { name: 'target', type: 'number' }
            ],
            returnType: 'number'
        },
        testCases: [
            { id: 1, input: { nums: [1, 3, 5, 6], target: 5 }, expectedOutput: 2, isExample: true },
            { id: 2, input: { nums: [1, 3, 5, 6], target: 2 }, expectedOutput: 1, isExample: true },
            { id: 3, input: { nums: [1, 3, 5, 6], target: 7 }, expectedOutput: 4, isExample: true },
            { id: 4, input: { nums: [1, 3, 5, 6], target: 0 }, expectedOutput: 0, isExample: false },
            { id: 5, input: { nums: [1], target: 1 }, expectedOutput: 0, isExample: false }
        ],
        constraints: [
            '1 <= nums.length <= 10^4',
            '-10^4 <= nums[i] <= 10^4',
            'nums contains distinct values sorted in ascending order.',
            '-10^4 <= target <= 10^4'
        ]
    },
    {
        id: 'plus-one',
        title: 'Plus One',
        description: `You are given a large integer represented as an integer array digits, where each digits[i] is the ith digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading 0's.

Increment the large integer by one and return the resulting array of digits.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def plusOne(self, digits):
        """
        :type digits: List[int]
        :rtype: List[int]
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number[]} digits
 * @return {number[]}
 */
var Solution = function() {};

Solution.prototype.plusOne = function(digits) {
    // Your code here
};`,
            java: `class Solution {
    public int[] plusOne(int[] digits) {
        // Your code here
        return new int[0];
    }
}`
        },
        functionSignature: {
            name: 'plusOne',
            params: [{ name: 'digits', type: 'number[]' }],
            returnType: 'number[]'
        },
        testCases: [
            { id: 1, input: { digits: [1, 2, 3] }, expectedOutput: [1, 2, 4], isExample: true },
            { id: 2, input: { digits: [4, 3, 2, 1] }, expectedOutput: [4, 3, 2, 2], isExample: true },
            { id: 3, input: { digits: [9] }, expectedOutput: [1, 0], isExample: true },
            { id: 4, input: { digits: [9, 9, 9] }, expectedOutput: [1, 0, 0, 0], isExample: false },
            { id: 5, input: { digits: [1, 9, 9] }, expectedOutput: [2, 0, 0], isExample: false }
        ],
        constraints: [
            '1 <= digits.length <= 100',
            '0 <= digits[i] <= 9',
            'digits does not contain any leading 0\'s.'
        ]
    },
    {
        id: 'climbing-stairs',
        title: 'Climbing Stairs',
        description: `You are climbing a staircase. It takes n steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def climbStairs(self, n):
        """
        :type n: int
        :rtype: int
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number} n
 * @return {number}
 */
var Solution = function() {};

Solution.prototype.climbStairs = function(n) {
    // Your code here
};`,
            java: `class Solution {
    public int climbStairs(int n) {
        // Your code here
        return 0;
    }
}`
        },
        functionSignature: {
            name: 'climbStairs',
            params: [{ name: 'n', type: 'number' }],
            returnType: 'number'
        },
        testCases: [
            { id: 1, input: { n: 2 }, expectedOutput: 2, isExample: true, explanation: 'There are two ways to climb to the top: 1. 1 step + 1 step, 2. 2 steps' },
            { id: 2, input: { n: 3 }, expectedOutput: 3, isExample: true, explanation: 'There are three ways to climb to the top: 1. 1 step + 1 step + 1 step, 2. 1 step + 2 steps, 3. 2 steps + 1 step' },
            { id: 3, input: { n: 4 }, expectedOutput: 5, isExample: false },
            { id: 4, input: { n: 5 }, expectedOutput: 8, isExample: false },
            { id: 5, input: { n: 6 }, expectedOutput: 13, isExample: false }
        ],
        constraints: [
            '1 <= n <= 45'
        ]
    },
    {
        id: 'maximum-subarray',
        title: 'Maximum Subarray',
        description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.

A subarray is a contiguous non-empty sequence of elements within an array.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def maxSubArray(self, nums):
        """
        :type nums: List[int]
        :rtype: int
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var Solution = function() {};

Solution.prototype.maxSubArray = function(nums) {
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
            { id: 1, input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expectedOutput: 6, isExample: true, explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
            { id: 2, input: { nums: [1] }, expectedOutput: 1, isExample: true },
            { id: 3, input: { nums: [5, 4, -1, 7, 8] }, expectedOutput: 23, isExample: true },
            { id: 4, input: { nums: [-1] }, expectedOutput: -1, isExample: false },
            { id: 5, input: { nums: [-2, -1] }, expectedOutput: -1, isExample: false }
        ],
        constraints: [
            '1 <= nums.length <= 10^5',
            '-10^4 <= nums[i] <= 10^4'
        ]
    },
    {
        id: 'best-time-to-buy-and-sell-stock',
        title: 'Best Time to Buy and Sell Stock',
        description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def maxProfit(self, prices):
        """
        :type prices: List[int]
        :rtype: int
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var Solution = function() {};

Solution.prototype.maxProfit = function(prices) {
    // Your code here
};`,
            java: `class Solution {
    public int maxProfit(int[] prices) {
        // Your code here
        return 0;
    }
}`
        },
        functionSignature: {
            name: 'maxProfit',
            params: [{ name: 'prices', type: 'number[]' }],
            returnType: 'number'
        },
        testCases: [
            { id: 1, input: { prices: [7, 1, 5, 3, 6, 4] }, expectedOutput: 5, isExample: true, explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5. Not 7-1 = 6, as selling price needs to be larger than buying price.' },
            { id: 2, input: { prices: [7, 6, 4, 3, 1] }, expectedOutput: 0, isExample: true, explanation: 'No transactions are done and the max profit = 0.' },
            { id: 3, input: { prices: [2, 4, 1] }, expectedOutput: 2, isExample: false },
            { id: 4, input: { prices: [2, 1, 2, 1, 0, 1, 2] }, expectedOutput: 2, isExample: false },
            { id: 5, input: { prices: [1, 2] }, expectedOutput: 1, isExample: false }
        ],
        constraints: [
            '1 <= prices.length <= 10^5',
            '0 <= prices[i] <= 10^4'
        ]
    },
    {
        id: 'contains-duplicate',
        title: 'Contains Duplicate',
        description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def containsDuplicate(self, nums):
        """
        :type nums: List[int]
        :rtype: bool
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var Solution = function() {};

Solution.prototype.containsDuplicate = function(nums) {
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
            { id: 3, input: { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] }, expectedOutput: true, isExample: true },
            { id: 4, input: { nums: [0] }, expectedOutput: false, isExample: false },
            { id: 5, input: { nums: [0, 0] }, expectedOutput: true, isExample: false }
        ],
        constraints: [
            '1 <= nums.length <= 10^5',
            '-10^9 <= nums[i] <= 10^9'
        ]
    },
    {
        id: 'majority-element',
        title: 'Majority Element',
        description: `Given an array nums of size n, return the majority element.

The majority element is the element that appears more than ⌊n / 2⌋ times. You may assume that the majority element always exists in the array.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def majorityElement(self, nums):
        """
        :type nums: List[int]
        :rtype: int
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var Solution = function() {};

Solution.prototype.majorityElement = function(nums) {
    // Your code here
};`,
            java: `class Solution {
    public int majorityElement(int[] nums) {
        // Your code here
        return 0;
    }
}`
        },
        functionSignature: {
            name: 'majorityElement',
            params: [{ name: 'nums', type: 'number[]' }],
            returnType: 'number'
        },
        testCases: [
            { id: 1, input: { nums: [3, 2, 3] }, expectedOutput: 3, isExample: true },
            { id: 2, input: { nums: [2, 2, 1, 1, 1, 2, 2] }, expectedOutput: 2, isExample: true },
            { id: 3, input: { nums: [1] }, expectedOutput: 1, isExample: false },
            { id: 4, input: { nums: [6, 5, 5] }, expectedOutput: 5, isExample: false },
            { id: 5, input: { nums: [8, 8, 7, 7, 7] }, expectedOutput: 7, isExample: false }
        ],
        constraints: [
            'n == nums.length',
            '1 <= n <= 5 * 10^4',
            '-10^9 <= nums[i] <= 10^9'
        ]
    },
    {
        id: 'single-number',
        title: 'Single Number',
        description: `Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def singleNumber(self, nums):
        """
        :type nums: List[int]
        :rtype: int
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var Solution = function() {};

Solution.prototype.singleNumber = function(nums) {
    // Your code here
};`,
            java: `class Solution {
    public int singleNumber(int[] nums) {
        // Your code here
        return 0;
    }
}`
        },
        functionSignature: {
            name: 'singleNumber',
            params: [{ name: 'nums', type: 'number[]' }],
            returnType: 'number'
        },
        testCases: [
            { id: 1, input: { nums: [2, 2, 1] }, expectedOutput: 1, isExample: true },
            { id: 2, input: { nums: [4, 1, 2, 1, 2] }, expectedOutput: 4, isExample: true },
            { id: 3, input: { nums: [1] }, expectedOutput: 1, isExample: true },
            { id: 4, input: { nums: [1, 0, 1] }, expectedOutput: 0, isExample: false },
            { id: 5, input: { nums: [1, 3, 1, -1, 3] }, expectedOutput: -1, isExample: false }
        ],
        constraints: [
            '1 <= nums.length <= 3 * 10^4',
            '-3 * 10^4 <= nums[i] <= 3 * 10^4',
            'Each element in the array appears twice except for one element which appears only once.'
        ]
    },
    {
        id: 'reverse-string',
        title: 'Reverse String',
        description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
        difficulty: 'easy',
        starterCode: {
            python: `class Solution:
    def reverseString(self, s):
        """
        :type s: List[str]
        :rtype: None Do not return anything, modify s in-place instead.
        """
        # Your code here
        pass`,
            javascript: `/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
var Solution = function() {};

Solution.prototype.reverseString = function(s) {
    // Your code here
};`,
            java: `class Solution {
    public void reverseString(char[] s) {
        // Your code here
    }
}`
        },
        functionSignature: {
            name: 'reverseString',
            params: [{ name: 's', type: 'string[]' }],
            returnType: 'void'
        },
        testCases: [
            { id: 1, input: { s: ["h", "e", "l", "l", "o"] }, expectedOutput: ["o", "l", "l", "e", "h"], isExample: true },
            { id: 2, input: { s: ["H", "a", "n", "n", "a", "h"] }, expectedOutput: ["h", "a", "n", "n", "a", "H"], isExample: true },
            { id: 3, input: { s: ["a"] }, expectedOutput: ["a"], isExample: false },
            { id: 4, input: { s: ["a", "b"] }, expectedOutput: ["b", "a"], isExample: false },
            { id: 5, input: { s: ["A", " ", "m", "a", "n", ",", " ", "a", " ", "p", "l", "a", "n", ",", " ", "a", " ", "c", "a", "n", "a", "l", ":", " ", "P", "a", "n", "a", "m", "a"] }, expectedOutput: ["a", "m", "a", "n", "a", "P", " ", ":", "l", "a", "n", "a", "c", " ", "a", " ", ",", "n", "a", "l", "p", " ", "a", " ", ",", "n", "a", "m", " ", "A"], isExample: false }
        ],
        constraints: [
            '1 <= s.length <= 10^5',
            's[i] is a printable ascii character.'
        ]
    }
]; 