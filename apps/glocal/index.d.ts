/// <reference types="vite/client" />

// Vite returns a URL string for `import x from './x.svg'`, not Next's
// `{ src, height, width }` StaticImageData object.
declare module '*.svg' {
  const url: string;
  export default url;
}
