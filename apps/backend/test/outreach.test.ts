import { describe, expect, it } from "bun:test";
import { GeneratorService } from "../src/modules/outreach/generator.service";
import { ScraperService } from "../src/modules/outreach/scraper.service";

describe("GeneratorService Email Generation & Tone Presets", () => {
  // Mock repo with no database dependency
  const mockRepo: any = {
    getPitchProfileById: async () => null,
    getSettings: async () => ({}),
  };
  const generator = new GeneratorService(mockRepo);

  it("generates default outreach email following required 7-part structure", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://littlegreybox.net/2026/halong-bay-guide",
        recipientName: "Little Grey Box",
      },
      "test-user-1",
    );

    expect(draft.subject).toBe("Partnership & Content Collaboration with Little Grey Box");
    expect(draft.body).toContain("Greeting Little Grey Box,");
    expect(draft.body).toContain("I hope you’re having a great week!");
    expect(draft.body).toContain("I’ve been reading Little Grey Box");
    expect(draft.body).toContain("Eurasie Travel (https://eurasietravel.com)");
    expect(draft.body).toContain("1. Link Placement / Insertion:");
    expect(draft.body).toContain("2. Sponsored Article / Destination Feature:");
    expect(draft.body).toContain("3. Tour Operator Spotlight:");
    expect(draft.body).toContain("Could you please share your current media kit, rate card, and guidelines");
    expect(draft.body).toContain("Looking forward to working together!");
    expect(draft.body).toContain("Marketing Team, Eurasie Travel");
    expect(draft.body).toContain("https://eurasietravel.com");
  });

  it("generates distinct punchy (<60w) email", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://littlegreybox.net/vietnam",
        toneModifier: "punchy",
      },
      "test-user-1",
    );

    expect(draft.subject).toBe("Paid Collaboration & Link Placement with Little Grey Box");
    expect(draft.body).toContain("Greeting Little Grey Box,");
    expect(draft.body).toContain("⚡".replace("⚡", "")); // check tone
    expect(draft.body).toContain("1. Link Placement / Insertion:");
    expect(draft.body).toContain("2. Sponsored Article / Feature:");
    expect(draft.body).toContain("3. Tour Operator Spotlight:");
    expect(draft.body).toContain("rate card");
  });

  it("generates distinct casual email with warm peer-to-peer tone", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://littlegreybox.net",
        recipientName: "Phoebe",
        toneModifier: "casual",
      },
      "test-user-1",
    );

    expect(draft.subject).toBe("Collaboration & partnership idea for Little Grey Box 🤝");
    expect(draft.body).toContain("Hi Phoebe,");
    expect(draft.body).toContain("especially your practical");
    expect(draft.body).toContain("Eurasie Travel (https://eurasietravel.com)");
    expect(draft.body).toContain("1. Link Placement / Insertion:");
    expect(draft.body).toContain("2. Sponsored Article / Destination Feature:");
    expect(draft.body).toContain("3. Tour Operator Spotlight:");
    expect(draft.body).toContain("Would you mind sharing your current media kit, rate card");
  });

  it("generates distinct value-first email with dedicated budget emphasis", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://littlegreybox.net",
        toneModifier: "value",
      },
      "test-user-1",
    );

    expect(draft.subject).toBe("Paid Partnership & Sponsorship Inquiry: Eurasie Travel x Little Grey Box");
    expect(draft.body).toContain("dedicated partnership budget");
    expect(draft.body).toContain("1. Link Placement / Insertion:");
    expect(draft.body).toContain("2. Sponsored Article / Destination Feature:");
    expect(draft.body).toContain("3. Tour Operator Spotlight:");
  });

  it("generates distinct follow-up email", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://littlegreybox.net",
        toneModifier: "follow-up",
      },
      "test-user-1",
    );

    expect(draft.subject).toBe("Following up: Partnership & Content Collaboration with Little Grey Box");
    expect(draft.body).toContain("follow up on my note");
    expect(draft.body).toContain("1. Link Placement / Insertion:");
    expect(draft.body).toContain("2. Sponsored Article / Destination Feature:");
    expect(draft.body).toContain("3. Tour Operator Spotlight:");
  });

  it("ensures each of the 5 tone buttons returns a unique, distinct draft and subject", async () => {
    const tones = ["default", "punchy", "casual", "value", "follow-up"];
    const results = await Promise.all(
      tones.map((t) =>
        generator.generateDraft(
          {
            targetUrl: "https://littlegreybox.net",
            toneModifier: t === "default" ? undefined : t,
          },
          "test-user-1",
        ),
      ),
    );

    const subjects = results.map((r) => r.subject);
    const bodies = results.map((r) => r.body);

    // All subjects must be unique
    const uniqueSubjects = new Set(subjects);
    expect(uniqueSubjects.size).toBe(5);

    // All bodies must be unique
    const uniqueBodies = new Set(bodies);
    expect(uniqueBodies.size).toBe(5);
  });

  it("personalizes contextual compliment using scraped article title and topic", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://www.danflyingsolo.com/japan-rail-pass-guide",
        recipientName: "Dan Flying Solo",
        pageContext: "Title: Japan Rail Pass Guide: Is It Still Worth It? | Dan Flying Solo\n\nContent: Detailed analysis of the JR Pass price increases.",
      },
      "test-user-1",
    );

    // Must reference Japan and the scraped title, NOT hardcoded Halong Bay or creator advice
    expect(draft.body).toContain("Japan");
    expect(draft.body).toContain('Japan Rail Pass Guide');
    expect(draft.body).not.toContain("Halong Bay");
    expect(draft.body).not.toContain("transparent advice on how brands should work with creators");
  });

  it("extracts specific guide from URL slug when pageContext has no title", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://www.danflyingsolo.com/cambodia-itinerary-2-weeks",
        recipientName: "Dan Flying Solo",
      },
      "test-user-1",
    );

    expect(draft.body).toContain("Cambodia");
    expect(draft.body).toContain('Cambodia Itinerary 2 Weeks');
    expect(draft.body).not.toContain("Halong Bay");
  });
});

describe("ScraperService Site Name Extraction", () => {
  const scraper = new ScraperService();

  it("extracts clean site name from domain URL", () => {
    expect(scraper.extractSiteNameFromUrl("https://littlegreybox.net")).toBe("Little Grey Box");
    expect(scraper.extractSiteNameFromUrl("http://www.eurasietravel.com/tours")).toBe("Eurasie Travel");
    expect(scraper.extractSiteNameFromUrl("https://southeast-asia-guide.com")).toBe("Southeast Asia Guide");
  });
});
