import { describe, expect, it } from "vitest";

describe("Crafted Men project title", () => {
  it("uses the configured brand title", () => {
    expect(process.env.VITE_APP_TITLE).toBe("Crafted Men");
  });
});
