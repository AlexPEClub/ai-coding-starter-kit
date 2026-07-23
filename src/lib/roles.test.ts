import { describe, it, expect } from "vitest";

import { USER_ROLES, ROLE_LABELS, ROLE_HOME, roleLabel } from "./roles";

describe("Rollenmodell", () => {
  it("hat genau 8 Rollen", () => {
    expect(USER_ROLES).toHaveLength(8);
    expect(USER_ROLES).toContain("admin");
    expect(USER_ROLES).toContain("fahrer");
    expect(USER_ROLES).toContain("redaktion");
  });

  it("hat für jede Rolle ein Label und eine Startseite", () => {
    for (const role of USER_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
      expect(ROLE_HOME[role]).toMatch(/^\//);
    }
  });

  it("roleLabel gibt das passende Label zurück", () => {
    expect(roleLabel("admin")).toBe("Admin / Verwaltung");
    expect(roleLabel("qs")).toBe("Qualitätssicherung");
  });
});
