/**
 * Sorting Algorithms in JavaScript
 */

/**
 * Bubble Sort Algorithm
 * 
 * How it works:
 * 1. Compare adjacent elements in the array
 * 2. Swap them if they are in the wrong order
 * 3. Repeat this process for the entire array until no swaps are needed
 * 
 * Time Complexity: O(n^2)
 * Space Complexity: O(1)
 * 
 * @param {number[]} arr - Array of numbers to sort
 * @returns {number[]} - Sorted array in ascending order
 */
function bubbleSort(arr) {
  // Create a copy of the array to avoid modifying the original
  const result = [...arr];
  const n = result.length;
  
  // Outer loop for number of passes
  for (let i = 0; i < n - 1; i++) {
    // Flag to optimize - if no swaps occur, array is sorted
    let swapped = false;
    
    // Inner loop for comparisons in each pass
    for (let j = 0; j < n - i - 1; j++) {
      // Compare adjacent elements
      if (result[j] > result[j + 1]) {
        // Swap if they are in wrong order
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
        swapped = true;
      }
    }
    
    // If no swapping occurred, array is already sorted
    if (!swapped) break;
  }
  
  return result;
}

/**
 * Quick Sort Algorithm
 * 
 * How it works:
 * 1. Choose a 'pivot' element from the array
 * 2. Partition the array so elements smaller than pivot come before it,
 *    and elements greater than pivot come after it
 * 3. Recursively apply the above steps to the sub-arrays
 * 
 * Time Complexity: O(n log n) average, O(n^2) worst case
 * Space Complexity: O(log n)
 * 
 * @param {number[]} arr - Array of numbers to sort
 * @returns {number[]} - Sorted array in ascending order
 */
function quickSort(arr) {
  // Base case: arrays with 0 or 1 element are already sorted
  if (arr.length <= 1) {
    return arr;
  }
  
  // Create a copy of the array to avoid modifying the original
  const result = [...arr];
  
  // Choose pivot (using middle element for better performance on sorted arrays)
  const pivotIndex = Math.floor(result.length / 2);
  const pivot = result[pivotIndex];
  
  // Partition the array into elements less than, equal to, and greater than pivot
  const less = [];
  const equal = [];
  const greater = [];
  
  for (let i = 0; i < result.length; i++) {
    if (result[i] < pivot) {
      less.push(result[i]);
    } else if (result[i] > pivot) {
      greater.push(result[i]);
    } else {
      equal.push(result[i]);
    }
  }
  
  // Recursively sort the less and greater arrays, then combine
  return [...quickSort(less), ...equal, ...quickSort(greater)];
}

// Example usage and testing
console.log('Testing sorting algorithms:');

const testArray = [64, 34, 25, 12, 22, 11, 90, 5];
console.log('Original array:', testArray);

console.log('Bubble sort result:', bubbleSort(testArray));
console.log('Quick sort result:', quickSort(testArray));

// Test with edge cases
console.log('\nEdge case tests:');
console.log('Empty array:', bubbleSort([]));
console.log('Single element:', bubbleSort([42]));
console.log('Already sorted:', bubbleSort([1, 2, 3, 4, 5]));
console.log('Reverse sorted:', bubbleSort([5, 4, 3, 2, 1]));
console.log('Duplicates:', bubbleSort([4, 2, 4, 1, 3, 2]));

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    bubbleSort,
    quickSort
  };
}