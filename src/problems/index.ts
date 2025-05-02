/**
 * src/problems/index.ts
 *
 * Barrel that aggregates every individual problem file in ./bank
 */
import twoSum                        from './bank/two-sum';
import bestTimeToBuyAndSell          from './bank/best-time-to-buy-and-sell-stock';
import containsDuplicate             from './bank/contains-duplicate';
import productExceptSelf             from './bank/product-of-array-except-self';
import maximumSubarray               from './bank/maximum-subarray';
import maximumProductSubarray        from './bank/maximum-product-subarray';
import findMinRotated               from './bank/find-minimum-in-rotated-sorted-array';
import searchRotated                from './bank/search-in-rotated-sorted-array';
import threeSum                      from './bank/three-sum';
import containerWithMostWater        from './bank/container-with-most-water';

export const problems = [
  twoSum,
  bestTimeToBuyAndSell,
  containsDuplicate,
  productExceptSelf,
  maximumSubarray,
  maximumProductSubarray,
  findMinRotated,
  searchRotated,
  threeSum,
  containerWithMostWater
];