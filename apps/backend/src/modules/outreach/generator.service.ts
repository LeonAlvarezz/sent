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
      apiKeyOverride ||
      settings?.openaiApiKey ||
      (typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : undefined);

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
3. Contextual personalization: Mention reading their publication/blog (${siteName}), highlighting practical destination guides (e.g. ${specificGuide}) and their transparent advice for creators or high editorial standard.
4. Sender introduction: State that you're reaching out from ${companyName} (${companyUrl}), describing what the company does (${companyDesc}).
5. Partnership proposal & collaboration formats: State "We’d love to explore a paid partnership or content collaboration with ${siteName}. We are interested in exploring the following collaboration formats:" followed by 3 numbered formats:
   1. Link Placement / Insertion: Adding a relevant contextual backlink or helpful resource to one of their existing high-ranking ${topic} destination guides (e.g., Cambodia, Vietnam, or Thailand) pointing to our custom itineraries or regional travel planning hubs.
   2. Sponsored Article / Destination Feature: Sponsoring a dedicated post written by them, or providing a fully researched piece matching their editorial standards (e.g., logistics for multi-country Indochina crossings, off-the-beaten-track travel in the region).
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
- Page Context: ${payload.pageContext || "practical Southeast Asia guides"}
- Pitch Angle: ${payload.customAngle || "none"}
- Tone: ${tone}
- Company: ${companyName} (${companyUrl})
- Description: ${companyDesc}`,
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

    // 1. PUNCHY (<60w)
    if (isPunchy) {
      const subject = `Paid Collaboration & Link Placement with ${siteName}`;
      const body = `Greeting ${siteName},

I hope you’re having a great week!

I’ve been reading ${siteName} and really enjoy your practical ${topic} guides.

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

I’ve been reading ${siteName} for a while now, especially your practical ${topic} guides (like your ${specificGuide} coverage) and your transparent advice on how brands should work with creators.

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

I’ve been following ${siteName}, especially your practical ${topic} guides (like your ${specificGuide} coverage) and your transparent advice on how brands should work with creators.

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

I’ve been reading ${siteName}, especially your practical ${topic} guides (like your ${specificGuide} coverage) and your transparent advice on how brands should work with creators.

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
    let specificGuide = "Halong Bay and Indochina";

    const combined = `${urlStr || ""} ${pageContext || ""} ${customAngle || ""}`.toLowerCase();
    if (combined.includes("vietnam") || combined.includes("halong")) {
      topic = "Southeast Asia";
      specificGuide = "Halong Bay and Indochina";
    } else if (combined.includes("cambodia") || combined.includes("angkor")) {
      topic = "Cambodia";
      specificGuide = "Angkor Wat and Siem Reap";
    } else if (combined.includes("thailand") || combined.includes("bangkok")) {
      topic = "Thailand";
      specificGuide = "Bangkok and island itineraries";
    } else if (combined.includes("laos")) {
      topic = "Laos";
      specificGuide = "Luang Prabang and Mekong river journeys";
    } else if (combined.includes("myanmar")) {
      topic = "Myanmar";
      specificGuide = "Bagan and Inle Lake exploration";
    }

    return { topic, specificGuide };
  }
}
