/// <reference types="vite/client" />

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.yaml" {
  const passages: import("./copy/chorus").ChorusPassage[];
  export default passages;
}
