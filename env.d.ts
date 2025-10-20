/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_NASA_API_KEY?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  /* Shim for 'suncalc' which doesn't ship its own types */
  declare module 'suncalc';
  