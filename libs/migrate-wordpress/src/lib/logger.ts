export function setupLogger() {
  if (!process.env['DEBUG']) {
    console.debug = data => {}
  }
}
