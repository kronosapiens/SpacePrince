/// <reference types="vite/client" />

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.yaml" {
  const passages: import("./game/types").ChorusPassage[];
  export default passages;
}
