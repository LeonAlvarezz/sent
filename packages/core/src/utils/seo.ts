export interface BacklinkSpamCandidate {
  domain?: string;
  referringUrl?: string;
  pageTitle?: string;
  anchor?: string;
  dr?: number;
  spamScore?: number;
  isSpam?: boolean;
}

/**
 * Detects whether a backlink item matches automated spam, link directory,
 * or PBN footprints (e.g. /dir/backlinks-for-*, automated checker networks).
 */
export function isSpamBacklink(item: BacklinkSpamCandidate): boolean {
  if (item.isSpam === true) {
    return true;
  }

  // DataForSEO proprietary spam score threshold
  if (typeof item.spamScore === "number" && item.spamScore >= 50) {
    return true;
  }

  const url = (item.referringUrl || "").toLowerCase();
  const domain = (item.domain || "").toLowerCase();
  const title = (item.pageTitle || "").toLowerCase();
  const anchor = (item.anchor || "").toLowerCase();

  // Automated link directory footprints in URL
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

  // Automated link building or fake checker footprints in Page Title
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

  // Automated disposable link farm domain keywords
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
