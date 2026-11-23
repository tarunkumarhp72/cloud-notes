import { useEffect } from "react";

export interface ImportedNoteFile {
  filename: string;
  content: string;
  isMarkdown: boolean;
}

export function exportNoteToFile(
  filename: string,
  content: string,
  isMarkdown: boolean = false
): void {
  let safeName = filename.trim() || "Untitled";
  if (isMarkdown) {
    if (safeName.toLowerCase().endsWith(".txt")) {
      safeName = safeName.slice(0, -4);
    }
    if (!safeName.toLowerCase().endsWith(".md")) {
      safeName += ".md";
    }
  } else {
    if (safeName.toLowerCase().endsWith(".md")) {
      safeName = safeName.slice(0, -3);
    }
    if (!safeName.toLowerCase().endsWith(".txt")) {
      safeName += ".txt";
    }
  }

  const mimeType = isMarkdown ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeName;
  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function readFileAsText(file: File): Promise<ImportedNoteFile> {
  const content = await file.text();
  const isMarkdown = /\.md$/i.test(file.name) || /\.markdown$/i.test(file.name);
  return {
    filename: file.name,
    content,
    isMarkdown,
  };
}

export function useFileDragAndDrop(
  onFileImported: (imported: ImportedNoteFile) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (
          file.type.startsWith("text/") ||
          /\.(txt|md|markdown|json|js|ts|css|html|log|csv)$/i.test(file.name)
        ) {
          try {
            const imported = await readFileAsText(file);
            onFileImported(imported);
          } catch (err) {
            console.error("Failed to read dropped file:", err);
          }
        }
      }
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFileImported, enabled]);
}
