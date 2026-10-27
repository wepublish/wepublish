// moduleResolution "node" ignores package exports, so TypeScript cannot find
// the CommonJS entry on its own. It has the same types as the main entry.
declare module 'i18next-icu/cjs' {
  export { default } from 'i18next-icu';
}
