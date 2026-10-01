import { describe, expect, it } from "bun:test";
import { isSpamBacklink } from "../src/utils/seo";

describe("isSpamBacklink Utility", () => {
  it("detects spam backlinks from directory and fake checker footprints", () => {
    // Exact examples from the user's screenshot
    expect(
      isSpamBacklink({
        domain: "blogcheckerfree.site",
        referringUrl: "https://blogcheckerfree.site/dir/backlinks-for-website",
        pageTitle: "Expert Premium Link Building Services for Stronger...",
        anchor: "High Authority southeastasiatravel.com Backlinks for Long Term SEO Ranking Growth",
        dr: 0,
      }),
    ).toBe(true);

    expect(
      isSpamBacklink({
        domain: "backlinkwizards.link",
        referringUrl: "https://backlinkwizards.link/dir/backlinks-for-website",
        pageTitle: "Expert Premium Link Building Services for Stronger...",
        anchor: "High Authority southeastasiatravel.com Backlinks for Long Term SEO Ranking Growth",
        dr: 33, // High manipulated DR
      }),
    ).toBe(true);

    expect(
      isSpamBacklink({
        domain: "freeserpchecker.online",
        referringUrl: "https://freeserpchecker.online/dir/backlinks-for-website",
        pageTitle: "Expert Premium Link Building Services for Stronger...",
        anchor: "High Authority southeastasiatravel.com Backlinks for Long Term SEO Ranking Growth",
        dr: 0,
      }),
    ).toBe(true);
  });

  it("detects spam based on high spamScore", () => {
    expect(
      isSpamBacklink({
        domain: "randomsite.com",
        referringUrl: "https://randomsite.com/page",
        pageTitle: "A Normal Page Title",
        anchor: "Click here",
        dr: 20,
        spamScore: 65,
      }),
    ).toBe(true);
  });

  it("does not flag legitimate authority websites as spam", () => {
    expect(
      isSpamBacklink({
        domain: "lonelyplanet.com",
        referringUrl: "https://www.lonelyplanet.com/articles/vietnam-travel-guide",
        pageTitle: "The Complete Guide to Traveling in Vietnam",
        anchor: "Southeast Asia Travel",
        dr: 92,
        spamScore: 2,
      }),
    ).toBe(false);

    expect(
      isSpamBacklink({
        domain: "theplanetd.com",
        referringUrl: "https://theplanetd.com/things-to-do-in-vietnam/",
        pageTitle: "Best Things to do in Vietnam - Travel Blog",
        anchor: "Vietnam Itinerary",
        dr: 74,
      }),
    ).toBe(false);
  });
});
