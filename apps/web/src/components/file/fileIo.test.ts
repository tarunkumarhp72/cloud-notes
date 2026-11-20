import { describe, it, expect, vi } from "vitest";
import { exportNoteToFile, readFileAsText } from "./fileIo";

describe("File I/O Utilities", () => {
  it("exports note as .txt download with default extension", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-uuid");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    exportNoteToFile("Notes", "Hello World!", false);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/test-uuid");

    clickSpy.mockRestore();
  });

  it("exports note as .md download when isMarkdown is true", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/test-uuid-2");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    exportNoteToFile("ReadMe", "# Title", true);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it("reads file as text and detects markdown extension", async () => {
    const txtFile = new File(["Plain text content"], "sample.txt", { type: "text/plain" });
    const txtResult = await readFileAsText(txtFile);
    expect(txtResult.filename).toBe("sample.txt");
    expect(txtResult.content).toBe("Plain text content");
    expect(txtResult.isMarkdown).toBe(false);

    const mdFile = new File(["# Markdown content"], "guide.md", { type: "text/markdown" });
    const mdResult = await readFileAsText(mdFile);
    expect(mdResult.filename).toBe("guide.md");
    expect(mdResult.content).toBe("# Markdown content");
    expect(mdResult.isMarkdown).toBe(true);
  });
});
