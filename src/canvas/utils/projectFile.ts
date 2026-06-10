import type { CanvasAction, CanvasDimensions, Layer } from "@/canvas/types";

export type ProjectFile = {
  format: "los-pibes-que-dibujan";
  version: 1;
  canvasSize: CanvasDimensions;
  layers: Layer[];
  activeLayerId: string;
  actions: CanvasAction[];
};

const AUTOSAVE_KEY = "lpqd_autosave";

export function exportToFile(data: ProjectFile, name = "dibujo") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.dibujo`;
  link.click();
  URL.revokeObjectURL(url);
}

export function importFromFile(): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dibujo,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No se seleccionó ningún archivo"));
        return;
      }
      try {
        const text = await file.text();
        const data = JSON.parse(text) as ProjectFile;
        if (data.format !== "los-pibes-que-dibujan") {
          reject(new Error("El archivo no es un proyecto válido"));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error("No se pudo leer el archivo"));
      }
    };
    input.click();
  });
}

export function autosaveSave(data: ProjectFile) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {
    /* storage lleno */
  }
}

export function autosaveLoad(): ProjectFile | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ProjectFile;
    if (data.format !== "los-pibes-que-dibujan") return null;
    return data;
  } catch {
    return null;
  }
}

export function autosaveClear() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    /* ignore */
  }
}
