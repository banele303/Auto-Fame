declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any);
    text(text: string, x: number, y: number): void;
    addPage(): void;
    setFontSize(size: number): void;
    save(filename: string): void;
    setTextColor(r: number | string, g?: number, b?: number): void;
    setFillColor(r: number | string, g?: number, b?: number): void;
    setDrawColor(r: number | string, g?: number, b?: number): void;
    setLineWidth(width: number): void;
    setFont(fontName: string, fontStyle?: string): void;
    rect(x: number, y: number, width: number, height: number, style?: string): void;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  }
}
