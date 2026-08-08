import { test, expect } from "@playwright/test";

/**
 * PROJ-45 — Fahrer: Tour-Kartenansicht
 *
 * Läuft gegen echte Produktionsdaten (kein Staging vorhanden, gleiches
 * Muster wie PROJ-42-routenberechnung.spec.ts). Entstanden aus dem Refine
 * 2026-08-08: die vorherige QA-Runde bewertete die Kartenansicht per
 * Code-Review als "9/9 PASS", aber ein echter Live-Test durch den User
 * zeigte, dass Marker-Nummern (SVG-Doppel-Encoding) und die Routenlinie
 * (fehlende route_geometry-Validierung) trotzdem nicht funktionierten.
 * Dieser Test prüft genau die zwei Dinge, die Code-Review nicht gefangen
 * hat, direkt im Browser gegen die Live-App — rein lesend, keine
 * Zustandsänderung an echten Touren.
 */

const FAHRER_EMAIL = "playwright-test@tms.gudel-werkzeuge.de";
const PASSWORD = "TestPass123!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(FAHRER_EMAIL);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 });
}

test.describe("PROJ-45 Tour-Kartenansicht — Marker-Nummern, Name-Labels, Routenlinie", () => {
  test("Karte zeigt lesbare Marker-Icons, dauerhafte Name-Labels und eine Verbindungslinie", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/fahrer");
    await page.getByRole("tab", { name: "Tourenplanung" }).click();

    // Erste verfügbare (nicht deaktivierte) "Karte"-Schaltfläche einer Tour
    // mit Datum öffnen — welche Tour das konkret ist, ist für diesen Test
    // irrelevant, es geht um das Rendering selbst.
    const karteButton = page.getByRole("button", { name: "Karte" }).and(page.locator(":not([disabled])")).first();
    await karteButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15000 });

    const karte = dialog.locator(".leaflet-container");
    await expect(karte).toBeVisible({ timeout: 15000 });

    // 1) Marker-Icons: mindestens ein Stopp-Marker, dessen SVG-Data-URI
    //    NICHT doppelt kodiert ist (Regression-Guard für den %2523-Bug) und
    //    einen der erwarteten Hex-Farbwerte enthält (Beweis, dass die Zahl
    //    tatsächlich sichtbar gerendert wird, nicht schwarz-auf-schwarz).
    const markerBilder = karte.locator("img.leaflet-marker-icon");
    await expect(markerBilder.first()).toBeVisible({ timeout: 15000 });

    const alleSrcs = await markerBilder.evaluateAll((imgs) =>
      imgs.map((img) => (img as HTMLImageElement).src)
    );
    const svgSrcs = alleSrcs.filter((src) => src.startsWith("data:image/svg+xml,"));
    expect(svgSrcs.length, "Keine SVG-Marker-Icons gefunden").toBeGreaterThan(0);

    const decodedSrcs = svgSrcs.map((src) =>
      decodeURIComponent(src.replace("data:image/svg+xml,", ""))
    );
    for (const svg of decodedSrcs) {
      expect(svg, "SVG enthält doppelt-kodiertes %2523 (Encoding-Regression)").not.toContain(
        "%2523"
      );
    }
    const mitSichtbarerFarbe = decodedSrcs.some(
      (svg) => svg.includes("#FF6B6D") || svg.includes("#CCCCCC") || svg.includes("#4ECDC4")
    );
    expect(mitSichtbarerFarbe, "Kein Marker-Icon mit gültigem, sichtbarem Fill-Wert").toBe(true);

    // 2) Name-Label dauerhaft sichtbar (permanenter Leaflet-Tooltip), ohne
    //    dass ein Marker angetippt werden musste.
    const nameLabels = karte.locator(".leaflet-tooltip.tour-karte-stopp-label");
    await expect(nameLabels.first()).toBeVisible({ timeout: 15000 });
    const labelText = await nameLabels.first().textContent();
    expect(labelText?.trim().length, "Name-Label ist leer").toBeGreaterThan(0);

    // 3) Verbindungslinie zwischen Depot/Stopps (echte Route oder
    //    gestrichelte Fallback-Gerade) — Leaflet rendert Vektor-Layer als
    //    SVG-<path> im Overlay-Pane.
    const routenlinie = karte.locator(".leaflet-overlay-pane path");
    await expect(routenlinie.first()).toBeVisible({ timeout: 15000 });
  });
});
