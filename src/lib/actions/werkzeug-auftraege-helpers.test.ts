import { describe, it, expect } from "vitest";
import { kommissionsPflichtFehler, KOMMISSION_PFLICHT_FEHLER } from "./werkzeug-auftraege-helpers";

describe("kommissionsPflichtFehler", () => {
  it("returns null when Kommission is not required", () => {
    const result = kommissionsPflichtFehler(
      { pflicht: false, typ: "dynamisch" },
      { kommission_id: null, kommission_freitext: null }
    );
    expect(result).toBeNull();
  });

  it("returns an error for typ=statisch when no kommission_id is set", () => {
    const result = kommissionsPflichtFehler(
      { pflicht: true, typ: "statisch" },
      { kommission_id: null, kommission_freitext: null }
    );
    expect(result).toBe(KOMMISSION_PFLICHT_FEHLER);
  });

  it("returns null for typ=statisch when kommission_id is set", () => {
    const result = kommissionsPflichtFehler(
      { pflicht: true, typ: "statisch" },
      { kommission_id: "some-uuid", kommission_freitext: null }
    );
    expect(result).toBeNull();
  });

  it("returns an error for typ=dynamisch when kommission_freitext is empty/whitespace", () => {
    expect(
      kommissionsPflichtFehler(
        { pflicht: true, typ: "dynamisch" },
        { kommission_id: null, kommission_freitext: null }
      )
    ).toBe(KOMMISSION_PFLICHT_FEHLER);

    expect(
      kommissionsPflichtFehler(
        { pflicht: true, typ: "dynamisch" },
        { kommission_id: null, kommission_freitext: "   " }
      )
    ).toBe(KOMMISSION_PFLICHT_FEHLER);
  });

  it("returns null for typ=dynamisch when kommission_freitext is filled", () => {
    const result = kommissionsPflichtFehler(
      { pflicht: true, typ: "dynamisch" },
      { kommission_id: null, kommission_freitext: "Projekt 1234" }
    );
    expect(result).toBeNull();
  });

  it("does not accept a statisch kommission_id as satisfying a dynamisch requirement", () => {
    const result = kommissionsPflichtFehler(
      { pflicht: true, typ: "dynamisch" },
      { kommission_id: "some-uuid", kommission_freitext: null }
    );
    expect(result).toBe(KOMMISSION_PFLICHT_FEHLER);
  });
});
