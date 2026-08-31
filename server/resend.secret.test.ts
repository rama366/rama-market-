import { describe, expect, it } from "vitest";

describe("Resend configuration", () => {
  it("authenticates with the configured email provider", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey, "RESEND_API_KEY must be configured").toBeTruthy();
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(response.status, "Resend credentials must authorize the domains endpoint").toBe(200);
  }, 15_000);
});
