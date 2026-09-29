import * as cheerio from "cheerio";

export interface ScrapeResult {
  url: string;
  title: string;
  siteName: string;
  description: string;
  h1: string;
  textSnippet: string;
  candidateEmails: string[];
}

export class ScraperService {
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  private isInvalidEmail(email: string): boolean {
    const lower = email.toLowerCase();
    const badSuffixes = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".svg",
      ".css",
      ".js",
    ];
    const badDomains = [
      "example.com",
      "domain.com",
      "yoursite.com",
      "sentry.io",
      "wixpress.com",
    ];
    return (
      badSuffixes.some((s) => lower.endsWith(s)) ||
      badDomains.some((d) => lower.includes(d)) ||
      lower.includes("noreply")
    );
  }

  private extractEmailsFromHtml(html: string, $: cheerio.CheerioAPI): string[] {
    const emails = new Set<string>();

    // 1. mailto: links
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const mail = href
          .replace(/^mailto:/i, "")
          .split("?")[0]
          .trim();
        if (mail && !this.isInvalidEmail(mail)) {
          emails.add(mail.toLowerCase());
        }
      }
    });

    // 2. regex scan
    const matches = html.match(this.emailRegex) || [];
    for (const m of matches) {
      if (!this.isInvalidEmail(m)) {
        emails.add(m.toLowerCase());
      }
    }

    return Array.from(emails);
  }

  public extractSiteNameFromUrl(targetUrl: string): string {
    try {
      const u = new URL(
        targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
          ? targetUrl
          : `https://${targetUrl}`,
      );
      const host = u.hostname.replace(/^www\./, "");
      const domain = host.split(".")[0];
      if (domain.toLowerCase() === "littlegreybox") {
        return "Little Grey Box";
      }
      const words = domain
        .replace(/[-_.]+/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .split(" ")
        .filter(Boolean);
      if (words.length > 0) {
        return words
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    } catch {
      // Fallback
    }
    return "";
  }

  private extractSiteName(targetUrl: string, title?: string): string {
    if (title) {
      if (title.includes(" - ")) {
        const parts = title.split(" - ");
        const end = parts[parts.length - 1].trim();
        if (
          end.length >= 2 &&
          end.length <= 40 &&
          !end.toLowerCase().includes("page")
        ) {
          return end;
        }
      }
      if (title.includes(" | ")) {
        const parts = title.split(" | ");
        const end = parts[parts.length - 1].trim();
        if (
          end.length >= 2 &&
          end.length <= 40 &&
          !end.toLowerCase().includes("page")
        ) {
          return end;
        }
      }
    }
    return this.extractSiteNameFromUrl(targetUrl);
  }

  async scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
    let targetUrl = rawUrl.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    const fallbackSiteName = this.extractSiteNameFromUrl(targetUrl);
    const parsed = new URL(targetUrl);
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let html = "";
    try {
      const res = await fetch(targetUrl, {
        headers,
        signal: controller.signal,
        redirect: "follow",
      });
      if (res.ok) {
        html = await res.text();
      }
    } catch {
      // Fallback empty if fetch fails
      html = "";
    } finally {
      clearTimeout(timeout);
    }

    if (!html) {
      return {
        url: targetUrl,
        title: "",
        siteName: fallbackSiteName,
        description: "",
        h1: "",
        textSnippet: "",
        candidateEmails: [],
      };
    }

    const $ = cheerio.load(html);

    // Extract title
    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim() ||
      $("title").text().trim() ||
      "";

    // Extract site name
    let siteName =
      $('meta[property="og:site_name"]').attr("content")?.trim() ||
      $('meta[name="application-name"]').attr("content")?.trim() ||
      "";
    if (!siteName) {
      siteName = this.extractSiteName(targetUrl, title);
    }

    // Extract description
    const description =
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[name="twitter:description"]').attr("content")?.trim() ||
      "";

    // Extract h1
    const h1 = $("h1").first().text().trim() || "";

    // Candidate emails
    let candidateEmails = this.extractEmailsFromHtml(html, $);

    // Extract clean content snippet
    $(
      "script, style, nav, footer, header, noscript, svg, iframe, form, aside, .cookie-banner, #cookie-notice, .sidebar",
    ).remove();
    const articleEl = $("article, main, .entry-content, .post-content, .article-content, #content").first();
    const rawContent = articleEl.length > 0 ? articleEl.text() : $("body").text();
    const bodyText = rawContent.replace(/\s+/g, " ").trim();
    const textSnippet = bodyText.slice(0, 1500);

    // If no emails found, attempt quick probe of /contact or /about on origin
    if (candidateEmails.length === 0) {
      try {
        const contactUrl = `${parsed.origin}/contact`;
        const probeController = new AbortController();
        const probeTimeout = setTimeout(() => probeController.abort(), 4000);
        const probeRes = await fetch(contactUrl, {
          headers,
          signal: probeController.signal,
        });
        clearTimeout(probeTimeout);
        if (probeRes.ok) {
          const probeHtml = await probeRes.text();
          const probe$ = cheerio.load(probeHtml);
          candidateEmails = this.extractEmailsFromHtml(probeHtml, probe$);
        }
      } catch {
        // Ignore probe errors
      }
    }

    return {
      url: targetUrl,
      title,
      siteName: siteName || fallbackSiteName,
      description,
      h1,
      textSnippet,
      candidateEmails,
    };
  }
}
