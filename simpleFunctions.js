// A function to calculate the square of a number
export function calculateSquare(number) {
  if (typeof number !== 'number') {
    throw new TypeError('Input must be a number');
  }
  return number * number;
}

// Example usage
const result = calculateSquare(5);
console.log(`The square of 5 is ${result}`);
