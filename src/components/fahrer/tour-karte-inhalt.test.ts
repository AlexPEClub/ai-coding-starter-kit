import { describe, it, expect } from "vitest";
import { erstelleStoppIcon } from "./tour-karte-inhalt";

// Bugfix (Refine 2026-08-08): erstelleStoppIcon schrieb Farben als bereits
// URL-encodetes "%23" direkt in den rohen SVG-String, der anschließend noch
// einmal durch encodeURIComponent lief — das kodierte "%23" doppelt zu
// "%2523" und ergab einen ungültigen SVG-fill-Wert (Browser fällt auf
// Schwarz zurück, Zahl unsichtbar). Diese Tests stellen sicher, dass die
// erzeugte Data-URI kein doppelt-kodiertes "%2523" enthält und die
// erwarteten Hex-Farben im decodierten SVG korrekt vorkommen.
describe("erstelleStoppIcon", () => {
  it("enthält kein doppelt-kodiertes %2523 in der Data-URI", () => {
    const icon = erstelleStoppIcon(1, false);
    const iconUrl = icon.options.iconUrl as string;

    expect(iconUrl).not.toContain("%2523");
  });

  it("decodiert zu einem SVG mit gültigem Koralle-Fill für offene Stopps", () => {
    const icon = erstelleStoppIcon(3, false);
    const iconUrl = icon.options.iconUrl as string;
    const svg = decodeURIComponent(iconUrl.replace("data:image/svg+xml,", ""));

    expect(svg).toContain('fill="#FF6B6D"');
    expect(svg).toContain('fill="#FFFFFF"');
    expect(svg).toContain("3");
  });

  it("decodiert zu einem SVG mit grauem Fill für erledigte Stopps", () => {
    const icon = erstelleStoppIcon(5, true);
    const iconUrl = icon.options.iconUrl as string;
    const svg = decodeURIComponent(iconUrl.replace("data:image/svg+xml,", ""));

    expect(svg).toContain('fill="#CCCCCC"');
  });
});
