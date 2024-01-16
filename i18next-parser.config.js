module.exports = {
  locales: ['en', 'de', 'fr'], // Your locales
  input: ['apps/editor/src/**', "libs/**"],       // Path to your source files
  output: 'public/locales/$LOCALE/$NAMESPACE.json', // Path to your translation files
};