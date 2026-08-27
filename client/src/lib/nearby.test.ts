import { describe, expect, it } from "vitest";
import { getFallbackMarkerPosition } from "./nearby";

describe("getFallbackMarkerPosition", () => {
  it("places a seller at the center when their geocoded city matches the buyer location", () => {
    expect(getFallbackMarkerPosition({ lat: 40.7128, lng: -74.006 }, 40_712_800, -74_006_000)).toEqual({ left: "50%", top: "50%" });
  });

  it("keeps distant seller marker positions within the local-area map boundaries", () => {
    expect(getFallbackMarkerPosition({ lat: 40.7128, lng: -74.006 }, 50_000_000, -90_000_000)).toEqual({ left: "8%", top: "10%" });
  });
});
