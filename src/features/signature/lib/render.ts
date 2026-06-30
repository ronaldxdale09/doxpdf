/**
 * Canvas helpers for producing transparent-PNG signatures from a drawing or
 * typed text. Everything happens on the client; nothing is uploaded.
 */

/** Crop a canvas to its non-transparent content and return a PNG data URL. */
export function trimCanvasToDataUrl(
  canvas: HTMLCanvasElement,
  pad = 12,
): string | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width, height } = canvas;
  if (width === 0 || height === 0) return null;

  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return null;

  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
  return out.toDataURL("image/png");
}

/** Render typed text in a handwriting font to a transparent PNG. */
export async function typedSignatureToDataUrl(
  text: string,
  fontFamily: string,
  color = "#16182e",
): Promise<string | null> {
  const value = text.trim();
  if (!value) return null;

  const fontSize = 160;
  const fontSpec = `${fontSize}px ${fontFamily}`;
  try {
    await document.fonts.load(fontSpec, value);
    await document.fonts.ready;
  } catch {
    // proceed with whatever is available
  }

  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d")!;
  mctx.font = fontSpec;
  const width = Math.ceil(mctx.measureText(value).width) + fontSize;
  const height = Math.ceil(fontSize * 1.8);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.font = fontSpec;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(value, fontSize / 2, height / 2);

  return trimCanvasToDataUrl(canvas, 16);
}

/** Normalize an uploaded image into a (size-capped) PNG data URL. */
export function fileToImageDataUrl(file: File, maxDim = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
