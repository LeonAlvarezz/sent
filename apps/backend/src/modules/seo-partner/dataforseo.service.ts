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
  spamScore?: number;
  isSpam?: boolean;
}

export interface FetchCompetitorBacklinksOptions {
  targetUrl: string;
  limit?: number;
  minDr?: number;
  dofollowOnly?: boolean;
  excludeSpam?: boolean;
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
    const limit = Math.min(Math.max(options.limit ?? 100, 1), 1000);
    const minDr = options.minDr ?? 0;
    const dofollowOnly = options.dofollowOnly ?? true;

    // Build DataForSEO filters array
    // Filter on domain_from_rank (DR) and dofollow
    const filters: any[] = [];
    if (dofollowOnly) {
      filters.push(["dofollow", "=", true]);
    }
    if (minDr > 0) {
      if (filters.length > 0) filters.push("and");
      filters.push(["domain_from_rank", ">=", minDr]);
    }

    const payload = [
      {
        target: cleanTarget,
        limit,
        mode: "one_per_domain",
        rank_scale: "one_hundred",
        order_by: ["domain_from_rank,desc"],
        exclude_internal_backlinks: true,
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

      const dr = item.domain_from_rank || item.rank || 0;
      const spamScore =
        typeof item.spam_score === "number" ? item.spam_score : undefined;
      const referringUrl = item.url_from || `https://${domain}`;
      const targetUrl = item.url_to || `https://${cleanTarget}`;
      const anchor = item.anchor?.trim() || "Click here";

      const isSpam = checkIsSpamBacklink({
        domain,
        referringUrl,
        pageTitle,
        anchor,
        spamScore,
      });

      return {
        domain,
        pageTitle,
        referringUrl,
        targetUrl,
        anchor,
        textPre: item.text_pre?.trim() || "",
        textPost: item.text_post?.trim() || "",
        dr,
        dofollow: Boolean(item.dofollow),
        spamScore,
        isSpam,
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

export function checkIsSpamBacklink(item: {
  domain?: string;
  referringUrl?: string;
  pageTitle?: string;
  anchor?: string;
  spamScore?: number;
}): boolean {
  if (typeof item.spamScore === "number" && item.spamScore >= 50) {
    return true;
  }

  const url = (item.referringUrl || "").toLowerCase();
  const domain = (item.domain || "").toLowerCase();
  const title = (item.pageTitle || "").toLowerCase();
  const anchor = (item.anchor || "").toLowerCase();

  // Directory and automated link footprints
  if (
    url.includes("/dir/backlinks") ||
    url.includes("/dir/") ||
    url.includes("/backlinks-for-") ||
    url.includes("/backlink-for-") ||
    url.includes("/buy-backlinks") ||
    url.includes("/free-backlinks") ||
    url.includes("/link-building-services") ||
    url.includes("/backlink-list") ||
    url.includes("/website-list") ||
    url.includes("/domain-list")
  ) {
    return true;
  }

  // Automated link building or fake checker footprints in title
  if (
    title.includes("link building services") ||
    title.includes("premium link building") ||
    title.includes("seo ranking growth") ||
    title.includes("da pa checker") ||
    title.includes("serp checker") ||
    title.includes("backlink checker") ||
    title.includes("free backlink generator") ||
    title.includes("buy backlinks") ||
    title.includes("directory of backlinks")
  ) {
    return true;
  }

  // Scraper network / automated anchor text footprints
  if (
    anchor.includes("backlinks for long term seo ranking growth") ||
    (anchor.includes("high authority") && anchor.includes("backlinks")) ||
    anchor.includes("buy cheap backlinks") ||
    anchor.includes("link building service")
  ) {
    return true;
  }

  // Disposable link farm domain keywords
  if (
    domain.includes("blogchecker") ||
    domain.includes("dapachecker") ||
    domain.includes("rankchecker") ||
    domain.includes("freeserpchecker") ||
    domain.includes("serpchecker") ||
    domain.includes("sitechecker") ||
    domain.includes("backlinkwizard") ||
    domain.includes("buybacklink") ||
    domain.includes("citationservice") ||
    domain.includes("freeseo") ||
    domain.includes("linkbuilder")
  ) {
    return true;
  }

  return false;
}

