/**
 * src/problems/bank/best-time-to-buy-and-sell-stock.ts
 */
import { Problem } from '../problemTypes';

const bestTimeToBuyAndSell: Problem = {
  id: 'best-time-to-buy-and-sell-stock',
  title: 'Best Time to Buy and Sell Stock',
  difficulty: 'easy',
  description: `You are given an array prices where prices[i] is the price of a given
stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and
choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot
achieve any profit, return 0.`,
  starterCode: {
    python: `class Solution:
    def maxProfit(self, prices):
        \"\"\"
        :type prices: List[int]
        :rtype: int
        \"\"\"
        # Your code here
        pass`,
    javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
var Solution = function () {};

Solution.prototype.maxProfit = function (prices) {
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
    {
      id: 1,
      input: { prices: [7, 1, 5, 3, 6, 4] },
      expectedOutput: 5,
      isExample: true,
      explanation:
        'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 5.'
    },
    {
      id: 2,
      input: { prices: [7, 6, 4, 3, 1] },
      expectedOutput: 0,
      isExample: true,
      explanation: 'No transactions are done and the max profit = 0.'
    },
    { id: 3, input: { prices: [2, 4, 1] }, expectedOutput: 2, isExample: false },
    {
      id: 4,
      input: { prices: [2, 1, 2, 1, 0, 1, 2] },
      expectedOutput: 2,
      isExample: false
    },
    { id: 5, input: { prices: [1, 2] }, expectedOutput: 1, isExample: false }
  ],
  constraints: [
    '1 <= prices.length <= 10^5',
    '0 <= prices[i] <= 10^4'
  ]
};

export default bestTimeToBuyAndSell;