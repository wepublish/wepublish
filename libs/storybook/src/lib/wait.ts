export function wait(amount = 0) {
  return new Promise(resolve => setTimeout(resolve, amount))
}
