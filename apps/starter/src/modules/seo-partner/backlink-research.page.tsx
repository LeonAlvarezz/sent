import React, { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  Button,
  CloseIcon,
  DataTable,
  InfoIcon,
  Input,
  isSpamBacklink,
  NativeSelect,
  PageLoadingSkeleton,
  SearchIcon,
  SpinnerIcon,
  Switch,
  Tag,
  toast,
  Unauthorized,
  useAuth,
} from "@z3/admin-core";
import { getErrorMessage } from "@/libs/api-client";
import { SEO_PARTNER_STATUS, USER_ROLE } from "@z3/types";
import type { CompetitorBacklinkItem, CreateSeoPartner } from "@z3/types";
import {
  useCompetitorBacklinksMutation,
  useImportSeoPartnersMutation,
} from "./seo-partner.api";
import { createBacklinkColumn } from "./components/backlink.column";

export function BacklinkResearchPage() {
  const navigate = useNavigate();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const isAuthorized =
    currentUser?.role === USER_ROLE.SUPER_ADMIN ||
    currentUser?.role === USER_ROLE.ADMIN;

  // Search parameters for competitor
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [minDr, setMinDr] = useState<string>("");
  const [limit, setLimit] = useState<number>(100);
  const [dofollowOnly, setDofollowOnly] = useState(true);
  const [excludeSpam, setExcludeSpam] = useState(true);

  // In-table local filters
  const [tableSearch, setTableSearch] = useState("");
  const [partnerStatusFilter, setPartnerStatusFilter] = useState<
    "all" | "new" | "existing"
  >("all");

  // Query state & results
  const [items, setItems] = useState<CompetitorBacklinkItem[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [queriedTarget, setQueriedTarget] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [importingDomains, setImportingDomains] = useState<
    Record<string, boolean>
  >({});

  const backlinkMutation = useCompetitorBacklinksMutation();
  const importMutation = useImportSeoPartnersMutation();

  const parsedMinDr = useMemo(() => {
    const trimmed = minDr.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return isNaN(n) ? undefined : n;
  }, [minDr]);

  const handleAnalyze = async (e?: React.SubmitEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = competitorUrl.trim();
    if (!cleanUrl) {
      toast.error("Please enter a competitor domain or URL");
      return;
    }

    try {
      const res = await backlinkMutation.mutateAsync({
        targetUrl: cleanUrl,
        limit,
        minDr: parsedMinDr,
        dofollowOnly,
        excludeSpam,
      });

      const fetchedItems = res.items;
      setItems(fetchedItems);
      setHasQueried(true);
      setQueriedTarget(
        cleanUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, ""),
      );

      // Auto-select visible non-spam new leads
      const initialSelection: RowSelectionState = {};
      fetchedItems.forEach((item) => {
        const isSpam = item.isSpam || isSpamBacklink(item);
        if (!item.isExistingPartner && (!excludeSpam || !isSpam)) {
          initialSelection[item.domain] = true;
        }
      });
      setRowSelection(initialSelection);

      if (fetchedItems.length === 0) {
        toast.info(
          "No backlinks found for this competitor matching your criteria",
        );
      } else {
        toast.success(
          `Discovered ${fetchedItems.length} referring partner backlinks`,
        );
      }
    } catch (err: any) {
      toast.error(
        getErrorMessage(
          err,
          "DataForSEO environment variables not provided. Please configure DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD.",
        ),
      );
    }
  };

  // Filter items in memory based on excludeSpam, parsedMinDr, partnerStatusFilter, tableSearch
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Partner status filter
      if (partnerStatusFilter === "new" && item.isExistingPartner) return false;
      if (partnerStatusFilter === "existing" && !item.isExistingPartner)
        return false;

      // 2. Spam filter
      if (excludeSpam && (item.isSpam || isSpamBacklink(item))) {
        return false;
      }

      // 3. Real-time Min DR filter (filters loaded items client-side as you type!)
      if (parsedMinDr !== undefined && item.dr < parsedMinDr) {
        return false;
      }

      // 4. In-table text search
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const inDomain = item.domain.toLowerCase().includes(q);
        const inTitle = (item.pageTitle || "").toLowerCase().includes(q);
        const inAnchor = item.anchor.toLowerCase().includes(q);
        const inUrl = item.referringUrl.toLowerCase().includes(q);
        const inTarget = item.targetUrl.toLowerCase().includes(q);
        if (!inDomain && !inTitle && !inAnchor && !inUrl && !inTarget)
          return false;
      }

      return true;
    });
  }, [items, partnerStatusFilter, excludeSpam, parsedMinDr, tableSearch]);

  const selectedDomains = Object.keys(rowSelection);
  const selectedCount = selectedDomains.length;

  const handleSelectAllNew = () => {
    const nextSelection: RowSelectionState = {};
    filteredItems.forEach((item) => {
      if (!item.isExistingPartner) {
        nextSelection[item.domain] = true;
      }
    });
    setRowSelection(nextSelection);
  };

  const handleClearSelection = () => {
    setRowSelection({});
  };

  const handleImportPartners = async (targets: CompetitorBacklinkItem[]) => {
    if (targets.length === 0) return;

    const targetLabel = queriedTarget || "Competitor";
    const partnersPayload: CreateSeoPartner[] = targets.map((item) => ({
      website: item.domain,
      url: item.referringUrl,
      dr: item.dr,
      backlinkFor: `Competitor: ${targetLabel}`,
      notes: `Referring page: "${item.pageTitle || item.domain}" -> Anchor: "${item.anchor || "None"}" pointing to ${item.targetUrl} (${item.dofollow ? "Dofollow" : "Nofollow"})`,
      outreachStatus: SEO_PARTNER_STATUS.NOT_STARTED,
      attributes: {
        source: "competitor_backlinks",
        competitor: targetLabel,
        targetUrl: item.targetUrl,
        pageTitle: item.pageTitle,
        anchor: item.anchor,
        textPre: item.textPre,
        textPost: item.textPost,
        dofollow: item.dofollow,
      },
    }));

    // Mark as importing
    const domainMap: Record<string, boolean> = {};
    targets.forEach((t) => {
      domainMap[t.domain] = true;
    });
    setImportingDomains((prev) => ({ ...prev, ...domainMap }));

    try {
      await importMutation.mutateAsync({ partners: partnersPayload });

      // Optimistically update local item state so they show as "Already Partner"
      setItems((prev) =>
        prev.map((i) =>
          domainMap[i.domain] ? { ...i, isExistingPartner: true } : i,
        ),
      );

      // Deselect imported rows
      setRowSelection((prev) => {
        const next = { ...prev };
        targets.forEach((t) => {
          delete next[t.domain];
        });
        return next;
      });

      toast.success(
        `Imported ${partnersPayload.length} partner${partnersPayload.length > 1 ? "s" : ""} to SEO Partners directory`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to import partner(s)");
    } finally {
      setImportingDomains((prev) => {
        const next = { ...prev };
        targets.forEach((t) => {
          delete next[t.domain];
        });
        return next;
      });
    }
  };

  const handleImportSelected = async () => {
    const selectedItems = items.filter((item) => item.domain in rowSelection);
    await handleImportPartners(selectedItems);
  };

  const handleSingleImport = async (item: CompetitorBacklinkItem) => {
    await handleImportPartners([item]);
  };

  // Keep useMemo for stable reference as per Tanstack Table Docs
  const columns = useMemo(
    () =>
      createBacklinkColumn({
        importingDomains,
        onImportSingle: handleSingleImport,
      }),
    [importingDomains],
  );
  if (isAuthLoading || !currentUser) {
    return <PageLoadingSkeleton />;
  }

  if (!isAuthorized) {
    return (
      <Unauthorized description="You do not have administrator permissions to access Backlink Research. Contact a system administrator for access." />
    );
  }

  const newLeadsCount = items.filter(
    (i) =>
      !i.isExistingPartner &&
      (!excludeSpam || !(i.isSpam || isSpamBacklink(i))),
  ).length;
  const existingCount = items.filter(
    (i) =>
      i.isExistingPartner &&
      (!excludeSpam || !(i.isSpam || isSpamBacklink(i))),
  ).length;
  const spamCount = items.filter(
    (i) => i.isSpam || isSpamBacklink(i),
  ).length;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Backlink Research
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Discover publisher websites linking to your competitors and import
            high-authority prospects into your SEO pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/seo-partners" })}
            className="gap-1.5"
          >
            <span>View All Partners</span>
          </Button>
        </div>
      </div>

      {/* Competitor Query Card */}
      <form onSubmit={handleAnalyze} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Paste competitor URL or domain (e.g. competitor.com or https://competitor.com/best-tours)"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              startIcon={
                <SearchIcon className="size-4 text-muted-foreground" />
              }
              className="w-full"
              autoFocus
            />
          </div>

          <div className="w-full sm:w-28 shrink-0">
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="Min DR (0)"
              value={minDr}
              onChange={(e) => setMinDr(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-36 shrink-0">
            <NativeSelect
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-9 text-xs"
            >
              <option value={50}>50 results</option>
              <option value={100}>100 results (Default)</option>
              <option value={200}>200 results</option>
              <option value={500}>500 results</option>
              <option value={1000}>1,000 results</option>
            </NativeSelect>
          </div>

          <Button
            type="submit"
            disabled={backlinkMutation.isPending || !competitorUrl.trim()}
            className="gap-1.5 shrink-0"
          >
            <SearchIcon className="size-4" />
            <span>
              {backlinkMutation.isPending ? "Analyzing..." : "Analyze"}
            </span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Switch
              size="sm"
              checked={dofollowOnly}
              onChange={setDofollowOnly}
              label="Dofollow links only"
            />
            <Switch
              size="sm"
              checked={excludeSpam}
              onChange={setExcludeSpam}
              label="Exclude spam & directory links"
            />
          </div>

          {hasQueried && items.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                Target: {queriedTarget}
              </span>
              <Tag color="blue" className="px-2 py-0.5">
                {newLeadsCount} New Leads
              </Tag>
              <Tag color="amber" className="px-2 py-0.5">
                {existingCount} In Partners
              </Tag>
              {spamCount > 0 && (
                <Tag color="zinc" className="px-2 py-0.5">
                  {spamCount} Spam {excludeSpam ? "Filtered" : "Detected"}
                </Tag>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Main Results View */}
      {hasQueried ? (
        <div className="flex flex-col gap-3">
          {/* Table Toolbar & In-Table Filters */}
          <div className="flex flex-col justify-start sm:justify-between sm:flex-row gap-3 bg-card p-3 rounded-xl border border-border">
            <Input
              placeholder="Search referring page, anchor, target URL..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              startIcon={
                <SearchIcon className="size-4 text-muted-foreground" />
              }
              containerClassName="h-8 w-fit"
              className="w-64 lg:w-80 text-xs"
            />

            {/* Selection & Batch Import Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {newLeadsCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllNew}
                  className="h-8 px-2.5 text-xs"
                >
                  Select All
                </Button>
              )}

              {selectedCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                onClick={handleImportSelected}
                disabled={selectedCount === 0 || importMutation.isPending}
                className="h-8 px-2"
              >
                <span>
                  {importMutation.isPending ? (
                    <SpinnerIcon />
                  ) : (
                    <p>
                      Import
                      {selectedCount > 0 && <span> ({selectedCount})</span>}
                    </p>
                  )}
                </span>
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredItems}
            loading={backlinkMutation.isPending}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => row.domain}
            pageSizeOptions={[10, 20, 50, 100]}
            initialPageSize={20}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <InfoIcon className="size-6 text-muted-foreground/60" />
                <p className="text-sm font-medium">
                  No backlinks match your search filters.
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Try adjusting your search query or reset status filter.
                </p>
              </div>
            }
          />
        </div>
      ) : (
        /* Empty Guidance State */
        <div className="flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-border bg-card/40 gap-4">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <SearchIcon className="size-6" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-foreground">
              Ready to spy on competitor backlinks
            </h3>
            <p className="text-xs text-muted mt-2">
              Enter a competitor domain above to discover referring pages,
              anchor context, and publisher leads.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
