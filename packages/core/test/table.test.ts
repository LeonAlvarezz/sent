import { describe, expect, it } from "bun:test";
import { getAutoColumnSize } from "../src/utils/table";

describe("getAutoColumnSize Utility", () => {
  it("returns default min size when data is empty or null", () => {
    expect(getAutoColumnSize([], (d: any) => d.name)).toBe(80);
    expect(getAutoColumnSize(null, (d: any) => d.name)).toBe(80);
    expect(getAutoColumnSize(undefined, (d: any) => d.name, { min: 140 })).toBe(140);
  });

  it("calculates size dynamically from the longest string in dataset", () => {
    const data = [
      { client: "Intro Travel" }, // 12 chars
      { client: "Competitor: audleytravel.com" }, // 28 chars
      { client: "Easia Travel" }, // 12 chars
    ];

    // 28 chars * 8px + 68px padding = 224 + 68 = 292
    const size = getAutoColumnSize(data, (d) => d.client, {
      min: 140,
      max: 400,
      charWidth: 8,
      padding: 68,
    });

    expect(size).toBe(292);
  });

  it("respects min and max bounds", () => {
    const shortData = [{ name: "Hi" }];
    expect(
      getAutoColumnSize(shortData, (d) => d.name, { min: 150, max: 300 }),
    ).toBe(150);

    const longData = [{ name: "A".repeat(100) }];
    expect(
      getAutoColumnSize(longData, (d) => d.name, { min: 100, max: 320 }),
    ).toBe(320);
  });

  it("factors in column header length if provided", () => {
    const data = [{ tag: "ab" }];
    // Header "Backlink For" (12 chars) is longer than "ab" (2 chars)
    // 12 * 8 + 48 = 144
    const sizeWithHeader = getAutoColumnSize(data, (d) => d.tag, {
      header: "Backlink For",
      min: 50,
    });
    expect(sizeWithHeader).toBe(144);
  });

  it("handles null, undefined, or non-string values safely", () => {
    const mixed = [
      { val: null },
      { val: undefined },
      { val: 12345 },
    ];
    // 5 chars * 8 + 48 = 88
    expect(getAutoColumnSize(mixed, (d) => d.val)).toBe(88);
  });
});
