import { describe, it, expect } from "vitest";
import { ueberschneidetSichMitBestehenden } from "./werkzeugkategorien-helpers";

describe("ueberschneidetSichMitBestehenden", () => {
  it("erkennt keine Überschneidung bei lückenlos aneinandergrenzenden Bereichen", () => {
    const bestehende = [{ von: 1, bis: 10 }];
    expect(ueberschneidetSichMitBestehenden(bestehende, { von: 11, bis: 20 })).toBe(false);
  });

  it("erkennt Überschneidung bei sich überlappenden Bereichen", () => {
    const bestehende = [{ von: 1, bis: 10 }];
    expect(ueberschneidetSichMitBestehenden(bestehende, { von: 8, bis: 20 })).toBe(true);
  });

  it("erkennt Überschneidung, wenn der neue Bereich vollständig innerhalb eines bestehenden liegt", () => {
    const bestehende = [{ von: 1, bis: 100 }];
    expect(ueberschneidetSichMitBestehenden(bestehende, { von: 10, bis: 20 })).toBe(true);
  });

  it("behandelt eine offene Obergrenze (bis=null) als 'bis unendlich'", () => {
    const bestehende = [{ von: 1, bis: 10 }];
    expect(ueberschneidetSichMitBestehenden(bestehende, { von: 10, bis: null })).toBe(true);
    expect(ueberschneidetSichMitBestehenden(bestehende, { von: 11, bis: null })).toBe(false);
  });

  it("erkennt Überschneidung zwischen zwei offenen Obergrenzen", () => {
    const bestehende = [{ von: 20, bis: null }];
    expect(ueberschneidetSichMitBestehenden(bestehende, { von: 5, bis: null })).toBe(true);
    expect(ueberschneidetSichMitBestehenden(bestehende, { von: 25, bis: null })).toBe(true);
  });

  it("gibt false zurück, wenn keine bestehenden Bereiche vorhanden sind", () => {
    expect(ueberschneidetSichMitBestehenden([], { von: 1, bis: 10 })).toBe(false);
  });

  it("ignoriert sich selbst nicht automatisch — Aufrufer muss die eigene Stufe vorher ausschließen", () => {
    const bestehende = [{ von: 1, bis: 10 }];
    expect(ueberschneidetSichMitBestehenden(bestehende, { von: 1, bis: 10 })).toBe(true);
  });
});
