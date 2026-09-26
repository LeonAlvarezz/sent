import OpenAI from "openai";
import { OutreachRepository } from "./outreach.repository";
import type { GenerateDraft } from "@z3/types";

export class GeneratorService {
  constructor(private readonly repo: OutreachRepository) {}

  async generateDraft(
    payload: GenerateDraft,
    userId: string,
    apiKeyOverride?: string,
  ): Promise<{ subject: string; body: string }> {
    const pitchProfile = payload.pitchProfileId
      ? await this.repo.getPitchProfileById(payload.pitchProfileId, userId)
      : null;

    // Sender company and details (defaults to Eurasie Travel)
    const companyName =
      pitchProfile?.name?.replace(/\s*\(.*\)/, "").trim() || "Eurasie Travel";
    const companyUrl = pitchProfile?.targetUrl || "https://eurasietravel.com";
    const companyDesc =
      pitchProfile?.valueProposition ||
      "an inbound tour specialist and travel publisher covering Cambodia, Vietnam, Laos, Myanmar, and Thailand, specializing in private tailor-made itineraries and local experiential travel";

    // Recipient & Site Name resolution
    const siteName = this.extractSiteName(
      payload.targetUrl,
      payload.pageContext,
    );
    const recipient =
      payload.recipientName?.trim() &&
      !["there", "alex", "alex vance"].includes(payload.recipientName.trim().toLowerCase())
        ? payload.recipientName.trim()
        : siteName;

    // Tone resolution
    const tone =
      payload.toneModifier ||
      pitchProfile?.toneInstructions ||
      "default";

    const { topic, specificGuide } = this.extractTopics(
      payload.targetUrl,
      payload.pageContext,
      payload.customAngle,
    );

    const settings = await this.repo.getSettings(userId);
    const apiKey =
      (apiKeyOverride?.trim() || undefined) ||
      (settings?.openaiApiKey?.trim() || undefined) ||
      (typeof process !== "undefined" && process.env?.OPENAI_API_KEY?.trim()
        ? process.env.OPENAI_API_KEY.trim()
        : undefined);

    if (apiKey) {
      try {
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: `You are an expert SEO and digital PR outreach specialist. Write personalized, high-converting 1-to-1 cold outreach emails for paid partnerships, link placements, and sponsored collaborations.

You MUST structure the email body strictly with the following sections:
1. Greeting: "Greeting ${siteName}," (or "Hi ${recipient}," for casual tone)
2. Warm opening line (e.g. "I hope you’re having a great week!").
3. Contextual personalization: Write an authentic, genuine 1-2 sentence compliment referencing ${siteName}. You MUST personalize this compliment using the actual scraped Page Context and Target URL provided in the user prompt:
   - Reference the actual article title, destination, guide topic, or photography/content focus found in the Page Context (e.g. "I’ve been reading ${siteName}, particularly your guide on [specific article/destination]...").
   - If Page Context is general, reference their site name (${siteName}) and travel/content niche naturally.
   - NEVER use generic placeholder text or invent topics/destinations not present in the provided context.
   - NEVER mention "Halong Bay", "Indochina", or "advice on how brands should work with creators" unless that exact topic explicitly appears in the scraped Page Context.
   - Keep the compliment authentic, professional, and natural.
4. Sender introduction: State that you're reaching out from ${companyName} (${companyUrl}), describing what the company does (${companyDesc}).
5. Partnership proposal & collaboration formats: State "We’d love to explore a paid partnership or content collaboration with ${siteName}. We are interested in exploring the following collaboration formats:" followed by 3 numbered formats:
   1. Link Placement / Insertion: Adding a relevant contextual backlink or helpful resource to one of their existing high-ranking ${topic} destination guides pointing to our custom itineraries or regional travel planning hubs.
   2. Sponsored Article / Destination Feature: Sponsoring a dedicated post written by them, or providing a fully researched piece matching their editorial standards (e.g., logistics for multi-country crossings, off-the-beaten-track travel in the region).
   3. Tour Operator Spotlight: Featuring ${companyName} in any upcoming guided tour / tour operator recommendation roundups for Southeast Asia.
6. Call to Action: "Could you please share your current media kit, rate card, and guidelines for link placements and sponsored collaborations?"
7. Sign-off:
   Looking forward to working together!

   Best regards,
   Marketing Team, ${companyName}
   ${companyUrl}

Tone Guidance:
- If tone is "punchy" or "<60w": Keep body concise, crisp, and direct to the point while preserving the 3 numbered collaboration formats and rate card request.
- If tone is "casual": Use a friendly, warm, conversational peer-to-peer tone ("Hi ${recipient},", "Hope you're having an awesome week!", enthusiastic compliment, friendly ask).
- If tone is "value": Highlight dedicated partnership budget, mutual value proposition, high reader utility, and authoritative local resources.
- If tone is "follow-up": Craft a polite follow-up checking in on the previous note, summarizing the 3 collaboration formats, and requesting their media kit and rate card.
- If default/unspecified: Balanced, professional, and complete matching the reference structure.

Output strictly valid JSON with keys "subject" and "body".`,
            },
            {
              role: "user",
              content: `Write outreach email:
- Recipient / Site: ${recipient} (${siteName})
- Target URL: ${payload.targetUrl || "none"}
- Scraped Page Context: ${payload.pageContext ? payload.pageContext.slice(0, 1500) : "General travel site"}
- Pitch Angle: ${payload.customAngle || "none"}
- Tone: ${tone}
- Company: ${companyName} (${companyUrl})
- Description: ${companyDesc}
- Detected Topic: ${topic}
- Detected Guide: ${specificGuide || "general destination guides"}`,
            },
          ],
        });

        const raw = response.choices[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.subject && parsed.body) {
            return {
              subject: parsed.subject.trim(),
              body: parsed.body.trim(),
            };
          }
        }
      } catch (err) {
        console.error("OpenAI generation failed, falling back to structured templates:", err);
      }
    }

    // Fallback generator adhering strictly to the required structure across all 5 tones
    return this.generateFallbackDraft({
      siteName,
      recipient,
      companyName,
      companyUrl,
      companyDesc,
      topic,
      specificGuide,
      customAngle: payload.customAngle,
      tone,
    });
  }

  private generateFallbackDraft(opts: {
    siteName: string;
    recipient: string;
    companyName: string;
    companyUrl: string;
    companyDesc: string;
    topic: string;
    specificGuide: string;
    customAngle?: string;
    tone: string;
  }): { subject: string; body: string } {
    const {
      siteName,
      recipient,
      companyName,
      companyUrl,
      companyDesc,
      topic,
      specificGuide,
      customAngle,
      tone,
    } = opts;

    const normalized = (tone || "").toLowerCase();
    const isPunchy = normalized.includes("punchy") || normalized.includes("60w");
    const isCasual = normalized.includes("casual") || normalized.includes("friendly");
    const isValue = normalized.includes("value") || normalized.includes("benefit");
    const isFollowUp = normalized.includes("follow");

    const angleSnippet = customAngle
      ? ` (specifically exploring ${customAngle})`
      : "";
    const guideMention = specificGuide ? ` (like ${specificGuide})` : "";

    // 1. PUNCHY (<60w)
    if (isPunchy) {
      const subject = `Paid Collaboration & Link Placement with ${siteName}`;
      const body = `Greeting ${siteName},

I hope you’re having a great week!

I’ve been reading ${siteName} and really enjoy your practical ${topic} guides${guideMention}.

I’m reaching out from ${companyName} (${companyUrl})—we are ${companyDesc}.

We’d love to explore a paid partnership or content collaboration with ${siteName}${angleSnippet} across:
1. Link Placement / Insertion: Adding a contextual resource or backlink in your existing ${topic} guides.
2. Sponsored Article / Feature: Sponsoring a dedicated post matching your editorial standards.
3. Tour Operator Spotlight: Featuring ${companyName} in upcoming Southeast Asia tour operator roundups.

Could you please share your current media kit, rate card, and guidelines for link placements and sponsored collaborations?

Looking forward to working together!

Best regards,
Marketing Team, ${companyName}
${companyUrl}`;
      return { subject, body };
    }

    // 2. CASUAL
    if (isCasual) {
      const greetingName = recipient && recipient !== "there" ? recipient : siteName;
      const subject = `Collaboration & partnership idea for ${siteName} 🤝`;
      const body = `Hi ${greetingName},

I hope you’re having a great week!

I’ve been reading ${siteName} for a while now, especially your practical ${topic} guides${guideMention} and the detailed tips you share.

I’m reaching out from ${companyName} (${companyUrl}). We are ${companyDesc}.

We’d love to explore a paid partnership or content collaboration with ${siteName}${angleSnippet}. We are interested in exploring the following collaboration formats:

1. Link Placement / Insertion: Adding a relevant contextual backlink or helpful resource to one of your existing high-ranking ${topic} destination guides (e.g., Cambodia, Vietnam, or Thailand) pointing to our custom itineraries or regional travel planning hubs.
2. Sponsored Article / Destination Feature: Sponsoring a dedicated post written by you, or providing a fully researched piece matching your editorial standards (e.g., logistics for multi-country Indochina crossings, off-the-beaten-track travel in the region).
3. Tour Operator Spotlight: Featuring ${companyName} in any upcoming guided tour / tour operator recommendation roundups for Southeast Asia.

Would you mind sharing your current media kit, rate card, and guidelines for link placements and sponsored collaborations?

Looking forward to hearing from you!

Best regards,
Marketing Team, ${companyName}
${companyUrl}`;
      return { subject, body };
    }

    // 3. VALUE-FIRST
    if (isValue) {
      const subject = `Paid Partnership & Sponsorship Inquiry: ${companyName} x ${siteName}`;
      const body = `Greeting ${siteName},

I hope you’re having a productive week!

I’ve been following ${siteName}, especially your practical ${topic} guides${guideMention} and your high-quality destination coverage.

I’m reaching out from ${companyName} (${companyUrl}). We are ${companyDesc}.

We have a dedicated partnership budget and would love to explore a paid partnership or content collaboration with ${siteName}${angleSnippet}. We are interested in exploring the following high-value collaboration formats:

1. Link Placement / Insertion: Adding a relevant contextual backlink or helpful resource to one of your existing high-ranking ${topic} destination guides (e.g., Cambodia, Vietnam, or Thailand) pointing to our custom itineraries or regional travel planning hubs.
2. Sponsored Article / Destination Feature: Sponsoring a dedicated post written by you, or providing a fully researched piece matching your editorial standards (e.g., logistics for multi-country Indochina crossings, off-the-beaten-track travel in the region).
3. Tour Operator Spotlight: Featuring ${companyName} in any upcoming guided tour / tour operator recommendation roundups for Southeast Asia.

Could you please share your current media kit, rate card, and guidelines for link placements and sponsored collaborations so we can explore next steps?

Looking forward to working together!

Best regards,
Marketing Team, ${companyName}
${companyUrl}`;
      return { subject, body };
    }

    // 4. FOLLOW-UP
    if (isFollowUp) {
      const subject = `Following up: Partnership & Content Collaboration with ${siteName}`;
      const body = `Greeting ${siteName},

I hope you’re having a great week!

I wanted to quickly follow up on my note regarding exploring a paid partnership or content collaboration between ${companyName} (${companyUrl}) and ${siteName}${angleSnippet}.

As a quick recap, we are ${companyDesc}, and we are interested in exploring the following collaboration formats:

1. Link Placement / Insertion: Adding a relevant contextual backlink or helpful resource to one of your existing high-ranking ${topic} destination guides (e.g., Cambodia, Vietnam, or Thailand) pointing to our custom itineraries or regional travel planning hubs.
2. Sponsored Article / Destination Feature: Sponsoring a dedicated post written by you, or providing a fully researched piece matching your editorial standards (e.g., logistics for multi-country Indochina crossings, off-the-beaten-track travel in the region).
3. Tour Operator Spotlight: Featuring ${companyName} in any upcoming guided tour / tour operator recommendation roundups for Southeast Asia.

Could you please share your current media kit, rate card, and guidelines for link placements and sponsored collaborations when you have a moment? If you're not the right person to contact for partnerships, could you kindly point me to the right person?

Looking forward to working together!

Best regards,
Marketing Team, ${companyName}
${companyUrl}`;
      return { subject, body };
    }

    // 5. DEFAULT / STANDARD (Matches user specification 100%)
    const subject = `Partnership & Content Collaboration with ${siteName}`;
    const body = `Greeting ${siteName}, 

I hope you’re having a great week!

I’ve been reading ${siteName}, especially your practical ${topic} guides${guideMention} and your thorough destination insights.

I’m reaching out from ${companyName} (${companyUrl}). We are ${companyDesc}.

We’d love to explore a paid partnership or content collaboration with ${siteName}${angleSnippet}. We are interested in exploring the following collaboration formats:

1. Link Placement / Insertion: Adding a relevant contextual backlink or helpful resource to one of your existing high-ranking ${topic} destination guides (e.g., Cambodia, Vietnam, or Thailand) pointing to our custom itineraries or regional travel planning hubs.
2. Sponsored Article / Destination Feature: Sponsoring a dedicated post written by you, or providing a fully researched piece matching your editorial standards (e.g., logistics for multi-country Indochina crossings, off-the-beaten-track travel in the region).
3. Tour Operator Spotlight: Featuring ${companyName} in any upcoming guided tour / tour operator recommendation roundups for Southeast Asia.

Could you please share your current media kit, rate card, and guidelines for link placements and sponsored collaborations?

Looking forward to working together!

Best regards,
Marketing Team, ${companyName}
${companyUrl}`;

    return { subject, body };
  }

  private extractSiteName(urlStr?: string, pageContext?: string): string {
    // 1. From page title / context if it contains Brand separator
    if (pageContext) {
      if (pageContext.includes(" - ")) {
        const parts = pageContext.split(" - ");
        const candidate = parts[parts.length - 1].trim();
        if (candidate.length >= 2 && candidate.length <= 40 && !candidate.toLowerCase().includes("page")) {
          return candidate;
        }
      }
      if (pageContext.includes(" | ")) {
        const parts = pageContext.split(" | ");
        const candidate = parts[parts.length - 1].trim();
        if (candidate.length >= 2 && candidate.length <= 40 && !candidate.toLowerCase().includes("page")) {
          return candidate;
        }
      }
    }

    // 2. From URL domain
    if (urlStr) {
      try {
        const u = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
        const host = u.hostname.replace(/^www\./, "");
        const domain = host.split(".")[0];
        if (domain.toLowerCase() === "littlegreybox") {
          return "Little Grey Box";
        }
        if (domain.toLowerCase() === "eurasietravel") {
          return "Eurasie Travel";
        }
        const words = domain
          .replace(/[-_]/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .split(" ")
          .filter(Boolean);
        if (words.length > 0) {
          return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
      } catch {
        // Fallback
      }
    }

    return "Little Grey Box";
  }

  private extractTopics(urlStr?: string, pageContext?: string, customAngle?: string) {
    let topic = "Southeast Asia";
    let specificGuide = "";

    // 1. Extract clean article/guide title from pageContext if present
    if (pageContext) {
      const titleMatch = pageContext.match(/(?:Article Title|Title|Heading):\s*([^\n\r]+)/i);
      if (titleMatch && titleMatch[1]) {
        let clean = titleMatch[1].trim();
        // Remove trailing brand separators (" | Dan Flying Solo", " - Travel Blog")
        clean = clean.replace(/\s*([|\-–—:]\s*[^|\-–—:]+)+$/, "").trim();
        if (clean.length >= 4 && clean.length <= 90) {
          specificGuide = `your "${clean}" guide`;
        }
      }
    }

    // 2. If no title in pageContext, try to extract article slug from URL path
    if (!specificGuide && urlStr) {
      try {
        const u = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
        const segments = u.pathname
          .split("/")
          .filter(
            (s) =>
              s &&
              ![
                "blog",
                "posts",
                "articles",
                "category",
                "tag",
                "travel",
                "author",
                "guide",
              ].includes(s.toLowerCase()),
          );
        if (segments.length > 0) {
          const last = segments[segments.length - 1].replace(/\.[a-z0-9]+$/i, "");
          if (last.length >= 4 && !/^\d+$/.test(last)) {
            const titleFromSlug = last
              .replace(/[-_]+/g, " ")
              .split(" ")
              .filter(Boolean)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" ");
            if (titleFromSlug.length >= 4 && titleFromSlug.length <= 70) {
              specificGuide = `your "${titleFromSlug}" coverage`;
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    // 3. Detect primary region/destination topic
    const combined = `${urlStr || ""} ${pageContext || ""} ${customAngle || ""}`.toLowerCase();
    if (
      combined.includes("vietnam") ||
      combined.includes("halong") ||
      combined.includes("hanoi") ||
      combined.includes("saigon") ||
      combined.includes("da nang")
    ) {
      topic = "Southeast Asia";
      if (!specificGuide) specificGuide = "your Vietnam destination coverage";
    } else if (
      combined.includes("cambodia") ||
      combined.includes("angkor") ||
      combined.includes("siem reap")
    ) {
      topic = "Cambodia";
      if (!specificGuide) specificGuide = "your Angkor Wat and Siem Reap guides";
    } else if (
      combined.includes("thailand") ||
      combined.includes("bangkok") ||
      combined.includes("phuket") ||
      combined.includes("chiang mai")
    ) {
      topic = "Thailand";
      if (!specificGuide) specificGuide = "your Thailand itineraries and guides";
    } else if (combined.includes("laos") || combined.includes("luang prabang")) {
      topic = "Laos";
      if (!specificGuide) specificGuide = "your Luang Prabang and Mekong river journeys";
    } else if (combined.includes("myanmar") || combined.includes("bagan")) {
      topic = "Myanmar";
      if (!specificGuide) specificGuide = "your Bagan and Inle Lake exploration";
    } else if (
      combined.includes("japan") ||
      combined.includes("tokyo") ||
      combined.includes("kyoto") ||
      combined.includes("osaka")
    ) {
      topic = "Japan";
      if (!specificGuide) specificGuide = "your Japan travel itineraries";
    } else if (
      combined.includes("bali") ||
      combined.includes("indonesia") ||
      combined.includes("lombok")
    ) {
      topic = "Indonesia";
      if (!specificGuide) specificGuide = "your Bali and Indonesia guides";
    } else if (
      combined.includes("europe") ||
      combined.includes("italy") ||
      combined.includes("spain") ||
      combined.includes("france")
    ) {
      topic = "Europe";
      if (!specificGuide) specificGuide = "your European destination coverage";
    } else if (combined.includes("asia") || combined.includes("indochina")) {
      topic = "Southeast Asia";
      if (!specificGuide) specificGuide = "your Southeast Asia coverage";
    } else {
      topic = "travel";
      if (!specificGuide) specificGuide = "your detailed destination guides";
    }

    return { topic, specificGuide };
  }
}
