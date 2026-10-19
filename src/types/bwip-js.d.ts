declare module 'bwip-js' {
  export interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: string;
    textyalign?: string;
    textsize?: number;
    barcolor?: string;
    backgroundcolor?: string;
    paddingwidth?: number;
    paddingheight?: number;
    rotate?: string;
    [key: string]: any;
  }

  export function toCanvas(
    canvas: HTMLCanvasElement | string,
    options: ToCanvasOptions,
    callback?: (err?: Error, cvs?: HTMLCanvasElement) => void
  ): HTMLCanvasElement;

  export function toSVG(
    options: ToCanvasOptions,
    callback?: (err?: Error, svg?: string) => void
  ): string;

  const bwipjs: {
    toCanvas: typeof toCanvas;
    toSVG: typeof toSVG;
  };

  export default bwipjs;
}
