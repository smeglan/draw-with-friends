export function hexToRgba(hex: string): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0, 255];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    255,
  ];
}

function colorsMatch(
  a: [number, number, number, number],
  b: [number, number, number, number],
  tolerance: number,
): boolean {
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance
  );
}

export function isUniformImageData(
  imageData: ImageData,
  targetColor: [number, number, number, number],
  tolerance: number,
): boolean {
  const { data } = imageData;
  const [rT, gT, bT, aT] = targetColor;
  for (let i = 0; i < data.length; i += 4) {
    if (
      Math.abs(data[i] - rT) > tolerance ||
      Math.abs(data[i + 1] - gT) > tolerance ||
      Math.abs(data[i + 2] - bT) > tolerance ||
      Math.abs(data[i + 3] - aT) > tolerance
    ) return false;
  }
  return true;
}

export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  targetColor: [number, number, number, number],
  fillColor: [number, number, number, number],
  tolerance = 25,
): void {
  const { width, height, data } = imageData;

  if (
    startX < 0 ||
    startX >= width ||
    startY < 0 ||
    startY >= height
  ) return;

  if (colorsMatch(targetColor, fillColor, 0)) return;

  const visited = new Uint8Array(width * height);
  const stack: [number, number][] = [[startX, startY]];

  const matchesAt = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    return colorsMatch(
      [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]],
      targetColor,
      tolerance,
    );
  };

  const paintAt = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    data[idx] = fillColor[0];
    data[idx + 1] = fillColor[1];
    data[idx + 2] = fillColor[2];
    data[idx + 3] = fillColor[3];
    visited[y * width + x] = 1;
  };

  while (stack.length > 0) {
    const [seedX, seedY] = stack.pop()!;
    let xLeft = seedX;
    let xRight = seedX;

    while (xLeft - 1 >= 0 && !visited[seedY * width + (xLeft - 1)] && matchesAt(xLeft - 1, seedY)) {
      xLeft--;
    }

    while (xRight + 1 < width && !visited[seedY * width + (xRight + 1)] && matchesAt(xRight + 1, seedY)) {
      xRight++;
    }

    for (let x = xLeft; x <= xRight; x++) {
      if (visited[seedY * width + x]) continue;
      paintAt(x, seedY);
    }

    for (const nextY of [seedY - 1, seedY + 1]) {
      if (nextY < 0 || nextY >= height) continue;

      let x = xLeft;
      while (x <= xRight) {
        while (x <= xRight && (visited[nextY * width + x] || !matchesAt(x, nextY))) {
          x++;
        }

        if (x > xRight) break;

        stack.push([x, nextY]);

        while (x <= xRight && !visited[nextY * width + x] && matchesAt(x, nextY)) {
          x++;
        }
      }
    }
  }
}

export function getTargetColor(
  imageData: ImageData,
  px: number,
  py: number,
  canvasWidth: number,
): [number, number, number, number] | null {
  const idx = (py * canvasWidth + px) * 4;
  if (idx < 0 || idx + 3 >= imageData.data.length) return null;
  return [
    imageData.data[idx],
    imageData.data[idx + 1],
    imageData.data[idx + 2],
    imageData.data[idx + 3],
  ];
}

export function applyFillToImageData(
  imageData: ImageData,
  canvasWidth: number,
  canvasHeight: number,
  x: number,
  y: number,
  fillHex: string,
  scale: number,
  tolerance = 25,
): void {
  const px = Math.round(x * scale);
  const py = Math.round(y * scale);

  if (px < 0 || px >= canvasWidth || py < 0 || py >= canvasHeight) return;

  const targetColor = getTargetColor(imageData, px, py, canvasWidth);
  if (!targetColor) return;

  const fillColor = hexToRgba(fillHex);
  if (colorsMatch(targetColor, fillColor, 0)) return;

  floodFill(imageData, px, py, targetColor, fillColor, tolerance);
}

export function applyFillToCanvas(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  fillHex: string,
  scale: number,
  tolerance = 25,
): void {
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  applyFillToImageData(imageData, canvas.width, canvas.height, x, y, fillHex, scale, tolerance);
  context.putImageData(imageData, 0, 0);
}
