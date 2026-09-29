import { describe, expect, it } from "bun:test";
import { CampaignService } from "../src/modules/campaign/campaign.service";

describe("Campaign Template Substitution", () => {
  const renderTemplate = CampaignService.renderTemplate;

  it("substitutes standard contact variables correctly", () => {
    const template = "Hi {{first_name}}, love what you are building at {{company_name}}!";
    const recipient = {
      firstName: "Alex",
      companyName: "Acme Corp",
      email: "alex@acme.com",
    };

    const rendered = renderTemplate(template, recipient);
    expect(rendered).toBe("Hi Alex, love what you are building at Acme Corp!");
  });

  it("handles whitespace inside token braces", () => {
    const template = "Hello {{  first_name  }}, check out {{ company_name }}.";
    const recipient = {
      firstName: "Sarah",
      companyName: "TechFlow",
      email: "sarah@techflow.io",
    };

    const rendered = renderTemplate(template, recipient);
    expect(rendered).toBe("Hello Sarah, check out TechFlow.");
  });

  it("substitutes dynamic custom attributes", () => {
    const template = "Hey {{first_name}}, saw your post on {{topic}}!";
    const recipient = {
      firstName: "John",
      email: "john@example.com",
      attributes: { topic: "SEO Backlinks" },
    };

    const rendered = renderTemplate(template, recipient);
    expect(rendered).toBe("Hey John, saw your post on SEO Backlinks!");
  });

  it("leaves empty string when token value is missing or null", () => {
    const template = "Hi {{first_name}}, hope you are doing well.";
    const recipient = {
      email: "unknown@example.com",
      firstName: null,
    };

    const rendered = renderTemplate(template, recipient);
    expect(rendered).toBe("Hi , hope you are doing well.");
  });

  it("substitutes {{sender_name}}, {{sender}}, and {{sender_email}} correctly", () => {
    const template =
      "Hi {{first_name}},\n\nBest regards,\n{{sender_name}} ({{sender_email}})\nFrom: {{sender}}";
    const recipient = {
      firstName: "Alex",
      email: "alex@acme.com",
    };
    const sender = {
      name: "Leon Hong",
      email: "leon@eurasietravel.com",
    };

    const rendered = renderTemplate(template, recipient, sender);
    expect(rendered).toBe(
      "Hi Alex,\n\nBest regards,\nLeon Hong (leon@eurasietravel.com)\nFrom: Leon Hong",
    );
  });

  it("handles empty sender gracefully when sender tokens are used", () => {
    const template = "Best regards,\n{{sender_name}}";
    const recipient = {
      email: "alex@acme.com",
    };

    const rendered = renderTemplate(template, recipient);
    expect(rendered).toBe("Best regards,\n");
  });
});

describe("Campaign Audience Targeting Schemas", () => {
  it("validates job title audience payload", async () => {
    const { CreateCampaignSchema } = await import("@z3/types");
    const v = await import("valibot");

    const payload = {
      name: "Editor Campaign",
      senderId: 1,
      jobTitle: "Editor",
      audienceType: "job_title",
      subject: "Hello {{first_name}}",
      body: "Love your work as {{title}}",
    };

    const parsed = v.parse(CreateCampaignSchema, payload);
    expect(parsed.jobTitle).toBe("Editor");
    expect(parsed.audienceType).toBe("job_title");
    expect(parsed.emailIds).toBeUndefined();
    expect(parsed.listId).toBeUndefined();
  });

  it("validates custom multi-select audience payload", async () => {
    const { CreateCampaignSchema } = await import("@z3/types");
    const v = await import("valibot");

    const payload = {
      name: "Handpicked Outreach",
      senderId: 2,
      emailIds: [10, 25, 42],
      audienceType: "custom",
      subject: "Quick question",
      body: "Are you free for a chat?",
    };

    const parsed = v.parse(CreateCampaignSchema, payload);
    expect(parsed.emailIds).toEqual([10, 25, 42]);
    expect(parsed.audienceType).toBe("custom");
    expect(parsed.jobTitle).toBeUndefined();
  });
});
