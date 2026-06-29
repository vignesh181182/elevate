// Client-side image compression for progress photos. Photos are stored as base64
// JPEG inside a Firestore doc (no external storage), so they MUST stay under the
// ~1MB per-doc limit. We downscale to a max dimension and drop JPEG quality,
// shrinking further until the data URL is comfortably small.
const MAX_CHARS = 900_000; // data-URL length cap, well under Firestore's 1,048,576-byte doc limit

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read the file'));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image'));
    img.src = src;
  });
}

function toJpeg(img: HTMLImageElement, maxDim: number, quality: number): string {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Compress an image file to a base64 JPEG data URL kept under the Firestore doc limit. */
export async function compressImage(file: File): Promise<string> {
  const img = await loadImage(await readAsDataURL(file));
  let maxDim = 1280;
  let quality = 0.7;
  let out = toJpeg(img, maxDim, quality);
  while (out.length > MAX_CHARS && (quality > 0.4 || maxDim > 640)) {
    if (quality > 0.4) {
      quality = Math.round((quality - 0.1) * 10) / 10;
    } else {
      maxDim = Math.round(maxDim * 0.8);
      quality = 0.7;
    }
    out = toJpeg(img, maxDim, quality);
  }
  return out;
}
