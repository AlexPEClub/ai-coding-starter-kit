import { describe, it, expect } from "vitest";
import {
  qrCodeSchema,
  gesamtgewichtSchema,
  kommissionBezeichnungSchema,
  ohneCodeNotizSchema,
  druckAnzahlSchema,
} from "./werkzeug-auftrag";

describe("qrCodeSchema", () => {
  it("accepts a plain non-empty code", () => {
    expect(qrCodeSchema.parse("WZ-ABC12345")).toBe("WZ-ABC12345");
  });

  it("trims surrounding whitespace", () => {
    expect(qrCodeSchema.parse("  WZ-ABC12345  ")).toBe("WZ-ABC12345");
  });

  it("rejects an empty string", () => {
    expect(() => qrCodeSchema.parse("")).toThrow();
  });

  it("rejects a whitespace-only string", () => {
    expect(() => qrCodeSchema.parse("   ")).toThrow();
  });
});

describe("gesamtgewichtSchema", () => {
  it("accepts a positive number", () => {
    expect(gesamtgewichtSchema.parse(12.5)).toBe(12.5);
  });

  it("coerces a numeric string", () => {
    expect(gesamtgewichtSchema.parse("3.2")).toBe(3.2);
  });

  it("rejects 0", () => {
    expect(() => gesamtgewichtSchema.parse(0)).toThrow();
  });

  it("rejects negative values", () => {
    expect(() => gesamtgewichtSchema.parse(-5)).toThrow();
  });

  it("rejects non-numeric input", () => {
    expect(() => gesamtgewichtSchema.parse("abc")).toThrow();
  });
});

describe("kommissionBezeichnungSchema", () => {
  it("accepts a normal label", () => {
    expect(kommissionBezeichnungSchema.parse("Werkstattbüro")).toBe("Werkstattbüro");
  });

  it("rejects an empty label", () => {
    expect(() => kommissionBezeichnungSchema.parse("")).toThrow();
  });

  it("rejects labels longer than 200 characters", () => {
    expect(() => kommissionBezeichnungSchema.parse("a".repeat(201))).toThrow();
  });
});

describe("ohneCodeNotizSchema", () => {
  it("accepts an empty string (optional note)", () => {
    expect(ohneCodeNotizSchema.parse("")).toBe("");
  });

  it("rejects a note longer than 500 characters", () => {
    expect(() => ohneCodeNotizSchema.parse("a".repeat(501))).toThrow();
  });
});

describe("druckAnzahlSchema", () => {
  it("accepts a valid positive integer", () => {
    expect(druckAnzahlSchema.parse(50)).toBe(50);
  });

  it("accepts the schnellwahl values 25/50/100", () => {
    expect(druckAnzahlSchema.parse(25)).toBe(25);
    expect(druckAnzahlSchema.parse(100)).toBe(100);
  });

  it("rejects 0 and negative values", () => {
    expect(() => druckAnzahlSchema.parse(0)).toThrow();
    expect(() => druckAnzahlSchema.parse(-10)).toThrow();
  });

  it("rejects non-integer values", () => {
    expect(() => druckAnzahlSchema.parse(12.5)).toThrow();
  });

  it("rejects values above 500", () => {
    expect(() => druckAnzahlSchema.parse(501)).toThrow();
  });
});
