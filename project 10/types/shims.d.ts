declare module '*.png' {
    const src: number | string;
    export default src;
  }
  
  declare module '*.jpg' {
    const src: number | string;
    export default src;
  }
  
  declare module '*.svg' {
    const content: any;
    export default content;
  }
  
  // Expo Router types (keeps TS happy in editors/build)
  declare module 'expo-router' {
    export * from 'expo-router/build';
  }
  