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

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const idx = y * width + x;

    if (visited[idx]) continue;
    visited[idx] = 1;

    const pi = idx * 4;
    if (
      !colorsMatch(
        [data[pi], data[pi + 1], data[pi + 2], data[pi + 3]],
        targetColor,
        tolerance,
      )
    ) continue;

    data[pi] = fillColor[0];
    data[pi + 1] = fillColor[1];
    data[pi + 2] = fillColor[2];
    data[pi + 3] = fillColor[3];

    if (x > 0) stack.push([x - 1, y]);
    if (x < width - 1) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y < height - 1) stack.push([x, y + 1]);
  }
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
  const px = Math.round(x * scale);
  const py = Math.round(y * scale);

  if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const targetIdx = (py * canvas.width + px) * 4;
  const targetColor: [number, number, number, number] = [
    imageData.data[targetIdx],
    imageData.data[targetIdx + 1],
    imageData.data[targetIdx + 2],
    imageData.data[targetIdx + 3],
  ];

  const fillColor = hexToRgba(fillHex);

  if (colorsMatch(targetColor, fillColor, 0)) return;

  floodFill(imageData, px, py, targetColor, fillColor, tolerance);
  context.putImageData(imageData, 0, 0);
}
