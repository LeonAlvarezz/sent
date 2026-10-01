import { describe, expect, it } from "bun:test";
import * as v from "valibot";
import { DataForSeoService } from "../src/modules/seo-partner/dataforseo.service";
import {
  CompetitorBacklinksQuerySchema,
  ListSeoPartnersQuerySchema,
  SeoPartnersListResponseSchema,
  SEO_PARTNER_STATUS,
} from "@z3/types";
import { SeoPartnerService } from "../src/modules/seo-partner/seo-partner.service";

describe("DataForSeoService", () => {
  it("cleans competitor target URLs and domains correctly", () => {
    const service = new DataForSeoService();
    expect(service.cleanTarget("https://competitor.com/")).toBe("competitor.com");
    expect(service.cleanTarget("http://sub.competitor.com/vietnam-tour/")).toBe("sub.competitor.com/vietnam-tour");
    expect(service.cleanTarget("  competitor.com  ")).toBe("competitor.com");
  });

  it("throws error when credentials are not configured in environment variables", async () => {
    const service = new DataForSeoService();
    expect(service.isConfigured()).toBe(false);

    expect(
      service.getCompetitorBacklinks({
        targetUrl: "vietnamtravelcompetitor.com",
        limit: 5,
        minDr: 50,
        dofollowOnly: true,
      }),
    ).rejects.toThrow("DataForSEO environment variables not provided");
  });
});

describe("CompetitorBacklinksQuerySchema Validation", () => {
  it("validates valid competitor backlinks query", () => {
    const valid = v.parse(CompetitorBacklinksQuerySchema, {
      targetUrl: "https://competitor.com",
      limit: 20,
      minDr: 30,
      dofollowOnly: true,
    });
    expect(valid.targetUrl).toBe("https://competitor.com");
    expect(valid.limit).toBe(20);
    expect(valid.minDr).toBe(30);
    expect(valid.dofollowOnly).toBe(true);
  });

  it("applies default limit and dofollowOnly when omitted", () => {
    const parsed = v.parse(CompetitorBacklinksQuerySchema, {
      targetUrl: "competitor.com",
    });
    expect(parsed.limit).toBe(50);
    expect(parsed.dofollowOnly).toBe(true);
  });

  it("throws validation error on empty targetUrl", () => {
    expect(() => {
      v.parse(CompetitorBacklinksQuerySchema, {
        targetUrl: "",
      });
    }).toThrow();
  });
});

describe("SeoPartnerService Competitor Backlinks with Existing Partner Detection", () => {
  it("flags existing partners correctly", async () => {
    const mockRepo: any = {
      getExistingWebsites: async () => new Set(["theplanetd.com", "nomadicmatt.com"]),
    };

    const stubDataForSeo: any = {
      getCompetitorBacklinks: async () => ({
        items: [
          {
            domain: "theplanetd.com",
            pageTitle: "Vietnam Itinerary",
            referringUrl: "https://theplanetd.com/vietnam",
            targetUrl: "https://vietnamtourist.com",
            anchor: "Vietnam Tours",
            dr: 74,
            dofollow: true,
          },
          {
            domain: "randomtravelblog.com",
            pageTitle: "Best Trips",
            referringUrl: "https://randomtravelblog.com/trip",
            targetUrl: "https://vietnamtourist.com",
            anchor: "Visit",
            dr: 45,
            dofollow: true,
          },
        ],
        totalCount: 2,
      }),
    };

    const service = new SeoPartnerService(mockRepo);

    const response = await service.getCompetitorBacklinks(
      "test-user-id",
      { targetUrl: "vietnamtourist.com", limit: 10, minDr: 0, dofollowOnly: true },
      stubDataForSeo,
    );

    expect(response.items.length).toBe(2);
    const planetD = response.items.find((i) => i.domain === "theplanetd.com");
    expect(planetD).toBeDefined();
    expect(planetD?.isExistingPartner).toBe(true);

    const other = response.items.find((i) => i.domain === "randomtravelblog.com");
    expect(other).toBeDefined();
    expect(other?.isExistingPartner).toBe(false);
  });
});

describe("ListSeoPartnersQuerySchema & SeoPartnersListResponseSchema Validation", () => {
  it("validates pagination query parameters with defaults", () => {
    const parsed = v.parse(ListSeoPartnersQuerySchema, {});
    expect(parsed.page).toBe(1);
    expect(parsed.page_size).toBe(10);
  });

  it("parses custom pagination, search, and status filters", () => {
    const parsed = v.parse(ListSeoPartnersQuerySchema, {
      page: "3",
      page_size: "25",
      search: "travel",
      status: SEO_PARTNER_STATUS.IN_PROGRESS,
    });
    expect(parsed.page).toBe(3);
    expect(parsed.page_size).toBe(25);
    expect(parsed.search).toBe("travel");
    expect(parsed.status).toBe(SEO_PARTNER_STATUS.IN_PROGRESS);
  });

  it("validates paginated seo partners list response envelope", () => {
    const mockPartner = {
      id: 1,
      userId: "u-1",
      website: "example.com",
      url: "https://example.com",
      contactEmail: "admin@example.com",
      dr: 50,
      backlinks: 100,
      backlinkFor: "Client A",
      outreachStatus: SEO_PARTNER_STATUS.ACCEPTED,
      outreachDate: new Date(),
      followUpDate: null,
      quotedPrice: "$100",
      notes: "Test note",
      attributes: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validEnvelope = {
      partners: [mockPartner],
      meta: {
        total_count: 50,
        page: 1,
        page_size: 10,
        page_count: 5,
      },
    };

    const result = v.parse(SeoPartnersListResponseSchema, validEnvelope);
    expect(result.partners.length).toBe(1);
    expect(result.meta.total_count).toBe(50);
    expect(result.meta.page_count).toBe(5);
  });
});

