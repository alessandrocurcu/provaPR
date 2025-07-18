import { describe, it, expect } from 'vitest';
import { calculateSquare, isEven } from './simpleFunctions';

describe('simpleFunctions', () => {
  it('should calculate the square of a number', () => {
    expect(calculateSquare(3)).toBe(9);
    expect(calculateSquare(0)).toBe(0);
  });

  it('should check if a number is even', () => {
    expect(isEven(4)).toBe(true);
    expect(isEven(5)).toBe(false);
  });

  it('should throw an error for invalid input', () => {
    expect(() => calculateSquare('a')).toThrow(TypeError);
    expect(() => isEven(null)).toThrow(TypeError);
  });
});
