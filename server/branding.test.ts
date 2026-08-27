import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Crafted Men branding", () => {
  it("uses the configured Crafted Men application title in the public HTML document", () => {
    const document = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

    expect(document).toContain("<title>Crafted Men</title>");
  });

  it("presents Crafted+ without collecting payment details", () => {
    const accountPage = readFileSync(resolve(process.cwd(), "client/src/pages/Account.tsx"), "utf8");

    expect(accountPage).toContain("Join the Crafted+ priority list");
    expect(accountPage).toContain("No payment details are required or collected.");
  });
});
