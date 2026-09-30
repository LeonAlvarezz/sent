export interface DataForSeoBacklinkRaw {
  domain: string;
  pageTitle?: string;
  referringUrl: string;
  targetUrl: string;
  anchor: string;
  textPre?: string;
  textPost?: string;
  dr: number;
  dofollow: boolean;
}

export interface FetchCompetitorBacklinksOptions {
  targetUrl: string;
  limit?: number;
  minDr?: number;
  dofollowOnly?: boolean;
}

export interface FetchCompetitorBacklinksResult {
  items: DataForSeoBacklinkRaw[];
  totalCount: number;
}

export class DataForSeoService {
  constructor(
    private readonly login?: string,
    private readonly password?: string,
  ) {}

  public isConfigured(): boolean {
    return Boolean(this.login?.trim() && this.password?.trim());
  }

  public cleanTarget(urlOrDomain: string): string {
    return urlOrDomain
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
  }

  async getCompetitorBacklinks(
    options: FetchCompetitorBacklinksOptions,
  ): Promise<FetchCompetitorBacklinksResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "DataForSEO environment variables not provided. Please configure DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.",
      );
    }

    const cleanTarget = this.cleanTarget(options.targetUrl);
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const minDr = options.minDr ?? 0;
    const dofollowOnly = options.dofollowOnly ?? true;

    // Build DataForSEO filters array
    // e.g. [["dofollow", "=", true], "and", ["rank", ">=", 20]]
    const filters: any[] = [];
    if (dofollowOnly) {
      filters.push(["dofollow", "=", true]);
    }
    if (minDr > 0) {
      if (filters.length > 0) filters.push("and");
      filters.push(["rank", ">=", minDr]);
    }

    const payload = [
      {
        target: cleanTarget,
        limit,
        mode: "one_per_domain",
        rank_scale: "one_hundred",
        order_by: ["rank,desc"],
        ...(filters.length > 0 ? { filters } : {}),
      },
    ];

    const credentials = btoa(`${this.login}:${this.password}`);
    const res = await fetch(
      "https://api.dataforseo.com/v3/backlinks/backlinks/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `DataForSEO API error (${res.status}): ${errText || res.statusText}`,
      );
    }

    const data: any = await res.json();
    if (data.status_code !== 20000) {
      throw new Error(
        `DataForSEO returned error: ${data.status_message || data.status_code}`,
      );
    }

    const task = data.tasks?.[0];
    if (!task) {
      return { items: [], totalCount: 0 };
    }

    if (task.status_code !== 20000) {
      throw new Error(
        `DataForSEO task failed: ${task.status_message || task.status_code}`,
      );
    }

    const result = task.result?.[0];
    const totalCount = result?.total_count || 0;
    const rawItems: any[] = result?.items || [];

    const items: DataForSeoBacklinkRaw[] = rawItems.map((item) => {
      const domain =
        item.domain_from?.trim() ||
        this.extractDomain(item.url_from) ||
        "unknown-publisher.com";

      const pageTitle =
        item.page_from_title?.trim() ||
        item.title?.trim() ||
        this.formatSlugToTitle(item.url_from) ||
        domain;

      return {
        domain,
        pageTitle,
        referringUrl: item.url_from || `https://${domain}`,
        targetUrl: item.url_to || `https://${cleanTarget}`,
        anchor: item.anchor?.trim() || "Click here",
        textPre: item.text_pre?.trim() || "",
        textPost: item.text_post?.trim() || "",
        dr: item.domain_from_rank || item.rank || 0,
        dofollow: Boolean(item.dofollow),
      };
    });

    return {
      items,
      totalCount,
    };
  }

  private extractDomain(url?: string): string {
    if (!url) return "";
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return url.split("/")[0] || "";
    }
  }

  private formatSlugToTitle(url?: string): string {
    if (!url) return "";
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      const slug = parsed.pathname.split("/").filter(Boolean).pop();
      if (!slug) return parsed.hostname;
      return slug
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {
      return url;
    }
  }
}
