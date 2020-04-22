export function detectLinearStep(numbers: number[]): number | null {
  if (numbers.length <= 1) return null

  let step = numbers[1] - numbers[0]
  return numbers.every((x, i) => i === 0 || x - numbers[i - 1] === step)
    ? step
    : null
}

export function wedgeNumber(number: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, number))
}
