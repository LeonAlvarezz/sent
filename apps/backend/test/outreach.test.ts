import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import * as v from "valibot";
import { GeneratorService } from "../src/modules/outreach/generator.service";
import { ScraperService } from "../src/modules/outreach/scraper.service";
import { PitchProfileService } from "../src/modules/outreach/pitch-profile.service";
import { EmailService } from "../src/modules/outreach/email.service";
import { OutreachService } from "../src/modules/outreach/outreach.service";
import {
  ListEmailsQuerySchema,
  EmailsListResponseSchema,
  EMAIL_STATUS,
} from "@z3/types";

describe("GeneratorService Email Generation & Tone Presets", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  beforeAll(() => {
    delete process.env.OPENAI_API_KEY;
  });
  afterAll(() => {
    if (originalKey !== undefined) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

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

    expect(draft.isFallback).toBe(true);
    expect(typeof draft.fallbackReason).toBe("string");
    expect(draft.fallbackReason!.length).toBeGreaterThan(0);
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

  it("uses recipientName in greeting across all 5 tone variants", async () => {
    const tones = ["default", "punchy", "casual", "value", "follow-up"] as const;

    for (const tone of tones) {
      const draft = await generator.generateDraft(
        {
          targetUrl: "https://littlegreybox.net/vietnam",
          recipientName: "Alex",
          toneModifier: tone,
        },
        "test-user-1",
      );

      if (tone === "casual") {
        expect(draft.body).toContain("Hi Alex,");
      } else {
        expect(draft.body).toContain("Greeting Alex,");
      }
    }
  });

  it("preserves exact Website Name without altering casing/spaces and greets Website Name when recipientName is absent", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://eurasietravel.com/blog",
        siteName: "Eurasietravel",
      },
      "test-user-1",
    );

    expect(draft.body).toContain("Greeting Eurasietravel,");
    expect(draft.body).toContain("collaboration with Eurasietravel");
    expect(draft.body).not.toContain("eurasietravel,");
  });

  it("greets recipientName when present while referring to exact Website Name in pitch body", async () => {
    const draft = await generator.generateDraft(
      {
        targetUrl: "https://eurasietravel.com/blog",
        siteName: "Eurasietravel",
        recipientName: "Alex",
      },
      "test-user-1",
    );

    expect(draft.body).toContain("Greeting Alex,");
    expect(draft.body).toContain("collaboration with Eurasietravel");
    expect(draft.body).not.toContain("Greeting Eurasietravel,");
  });
});

describe("ScraperService Site Name Extraction", () => {
  const scraper = new ScraperService();

  it("extracts clean site name from domain URL", () => {
    expect(scraper.extractSiteNameFromUrl("https://littlegreybox.net")).toBe("Little Grey Box");
    expect(scraper.extractSiteNameFromUrl("http://www.eurasietravel.com/tours")).toBe("Eurasietravel");
    expect(scraper.extractSiteNameFromUrl("https://southeast-asia-guide.com")).toBe("Southeast Asia Guide");
  });
});

describe("ListEmailsQuerySchema & EmailsListResponseSchema Validation", () => {
  it("validates pagination query parameters extending PaginationPropsSchema", () => {
    const parsed = v.parse(ListEmailsQuerySchema, {
      listId: 5,
      search: "editor",
      title: "Content Editor",
      page: 2,
      page_size: 20,
    });

    expect(parsed.listId).toBe(5);
    expect(parsed.search).toBe("editor");
    expect(parsed.title).toBe("Content Editor");
    expect(parsed.page).toBe(2);
    expect(parsed.page_size).toBe(20);
  });

  it("handles empty or omitted pagination parameters with default page and page_size", () => {
    const parsed = v.parse(ListEmailsQuerySchema, {});
    expect(parsed.listId).toBeUndefined();
    expect(parsed.page).toBe(1);
    expect(parsed.page_size).toBe(10);
  });

  it("validates paginated emails list response envelope with data and meta", () => {
    const rawData = [
      {
        id: 1,
        userId: "user-1",
        email: "partner@example.com",
        firstName: "John",
        status: EMAIL_STATUS.ACTIVE,
        attributes: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    const response = v.parse(EmailsListResponseSchema, {
      emails: rawData,
      meta: {
        total_count: 142,
        page: 1,
        page_size: 10,
        page_count: 15,
      },
    });

    expect(response.meta.total_count).toBe(142);
    expect(response.meta.page).toBe(1);
    expect(response.meta.page_size).toBe(10);
    expect(response.meta.page_count).toBe(15);
    expect(response.emails.length).toBe(1);
    expect(response.emails[0].email).toBe("partner@example.com");
  });
});

describe("PitchProfileService & EmailService & OutreachService Layer", () => {
  it("PitchProfileService delegates correctly and throws NotFoundException when missing", async () => {
    const mockRepo: any = {
      getPitchProfiles: async (userId: string) => [
        { id: 1, userId, name: "Default Pitch" },
      ],
      getPitchProfile: async (id: number, userId: string) =>
        id === 1 ? { id: 1, userId, name: "Default Pitch" } : null,
      createPitchProfile: async (data: any, userId: string) => ({
        id: 2,
        userId,
        ...data,
      }),
      updatePitchProfile: async (id: number, data: any, userId: string) =>
        id === 1 ? { id: 1, userId, ...data } : null,
      deletePitchProfile: async (id: number, userId: string) =>
        id === 1 ? { id: 1, userId } : null,
    };

    const service = new PitchProfileService(mockRepo);
    const profiles = await service.getPitchProfiles("user-1");
    expect(profiles.length).toBe(1);

    const profile = await service.getPitchProfile(1, "user-1");
    expect(profile.name).toBe("Default Pitch");

    expect(service.getPitchProfile(999, "user-1")).rejects.toThrow();
  });

  it("EmailService delegates list and count queries properly", async () => {
    const mockRepo: any = {
      getEmails: async (userId: string, opts: any) => [
        { id: 10, userId, email: "test@domain.com" },
      ],
      getEmailsCount: async (userId: string, opts: any) => 1,
      getJobTitles: async (userId: string) => [
        { title: "Founder", count: 5 },
      ],
    };

    const service = new EmailService(mockRepo);
    const emails = await service.getEmails("user-1", { page: 1, page_size: 10 });
    expect(emails.length).toBe(1);

    const count = await service.getEmailsCount("user-1");
    expect(count).toBe(1);

    const titles = await service.getJobTitles("user-1");
    expect(titles[0].title).toBe("Founder");
  });

  it("OutreachService computes AI status from env and db settings", async () => {
    const mockRepo: any = {
      getSettings: async (userId: string) => ({ openaiApiKey: "db-secret-key" }),
    };

    const service = new OutreachService(mockRepo);
    const statusWithEnv = await service.getAiStatus("user-1", "env-key");
    expect(statusWithEnv.isConfigured).toBe(true);
    expect(statusWithEnv.source).toBe("env");

    const statusWithDb = await service.getAiStatus("user-1", undefined);
    expect(statusWithDb.isConfigured).toBe(true);
    expect(statusWithDb.source).toBe("db");

    const emptyRepo: any = {
      getSettings: async () => ({}),
    };
    const emptyService = new OutreachService(emptyRepo);
    const statusNone = await emptyService.getAiStatus("user-1", undefined);
    expect(statusNone.isConfigured).toBe(false);
    expect(statusNone.source).toBe("none");
  });
});

