// A function to calculate the square of a number
export function calculateSquare(number) {
  if (typeof number !== 'number') {
    throw new TypeError('Input must be a number');
  }
  return number * number;
}

// A function to check if a number is even
export function isEven(number) {
  if (typeof number !== 'number') {
    throw new TypeError('Input must be a number');
  }
  return number % 2 === 0;
}

// Example usage
const result = calculateSquare(5);
console.log(`The square of 5 is ${result}`);

const isFiveEven = isEven(5);
console.log(`Is 5 even? ${isFiveEven}`);
