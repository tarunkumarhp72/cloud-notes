import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("T-042 Dual-screen and Ultra-wide Display Styles", () => {
  it("dualscreen.css handles horizontal-viewport-segments and seam avoidance", () => {
    const cssPath = path.resolve(__dirname, "dualscreen.css");
    expect(fs.existsSync(cssPath)).toBe(true);
    const content = fs.readFileSync(cssPath, "utf-8");

    // Must query viewport segments
    expect(content).toContain("horizontal-viewport-segments: 2");
    expect(content).toContain("vertical-viewport-segments: 2");
    expect(content).toContain("viewport-segment-width");
    // Must prevent controls/text from running across the hinge seam
    expect(content).toContain(".editorAreaContainer");
    expect(content).toContain("tabsContainer");
    expect(content).toContain("responsiveToolbar");
  });

  it("ultrawide.css clamps toolbar stretching and maintains full-width edge-to-edge editor", () => {
    const cssPath = path.resolve(__dirname, "ultrawide.css");
    expect(fs.existsSync(cssPath)).toBe(true);
    const content = fs.readFileSync(cssPath, "utf-8");

    // Covers 1920px and 2560px
    expect(content).toContain("min-width: 1920px");
    expect(content).toContain("min-width: 2560px");
    // Clamps toolbar
    expect(content).toContain(".responsiveToolbar");
    // Full width edge-to-edge
    expect(content).toContain("width: 100%");
    expect(content).toContain("editorWrapper");
  });
});
