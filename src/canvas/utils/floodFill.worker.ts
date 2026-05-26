// Web Worker for bucket tool (flood fill) operations

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

function floodFill(
  width: number,
  height: number,
  data: Uint8ClampedArray,
  startX: number,
  startY: number,
  targetColor: [number, number, number, number],
  fillColor: [number, number, number, number],
  tolerance = 25,
): void {
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

self.onmessage = (e: MessageEvent) => {
  const { data, width, height, startX, startY, targetColor, fillColor, tolerance } = e.data;
  
  floodFill(width, height, data, startX, startY, targetColor, fillColor, tolerance);
  
  // Post modified data back to the main thread using transferable objects
  (self as any).postMessage({ data }, [data.buffer]);
};
