import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { seoPartner } from "@/db/schema";
import type {
  CreateSeoPartner,
  UpdateSeoPartner,
  SEO_PARTNER_STATUS,
} from "@z3/types";

export interface ListSeoPartnersOptions {
  search?: string;
  status?: SEO_PARTNER_STATUS;
  backlinkFor?: string;
  minDr?: number;
  maxDr?: number;
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
  sortBy?: "website" | "dr" | "backlinks" | "outreachDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export class SeoPartnerRepository {
  constructor(private readonly db: Database) {}

  private buildWhereConditions(userId: string, options?: ListSeoPartnersOptions) {
    const conditions = [eq(seoPartner.userId, userId)];

    if (options?.search) {
      const term = `%${options.search.trim()}%`;
      conditions.push(
        or(
          like(seoPartner.website, term),
          like(seoPartner.url, term),
          like(seoPartner.backlinkFor, term),
          like(seoPartner.notes, term),
        )!,
      );
    }

    if (options?.status) {
      conditions.push(eq(seoPartner.outreachStatus, options.status));
    }

    if (options?.backlinkFor) {
      conditions.push(eq(seoPartner.backlinkFor, options.backlinkFor.trim()));
    }

    if (options?.minDr !== undefined) {
      conditions.push(gte(seoPartner.dr, options.minDr));
    }

    if (options?.maxDr !== undefined) {
      conditions.push(lte(seoPartner.dr, options.maxDr));
    }

    return and(...conditions);
  }

  async getPartners(userId: string, options?: ListSeoPartnersOptions) {
    const where = this.buildWhereConditions(userId, options);

    // Determine sort column
    let sortCol: any = seoPartner.createdAt;
    if (options?.sortBy === "website") sortCol = seoPartner.website;
    else if (options?.sortBy === "dr") sortCol = seoPartner.dr;
    else if (options?.sortBy === "backlinks") sortCol = seoPartner.backlinks;
    else if (options?.sortBy === "outreachDate") sortCol = seoPartner.outreachDate;

    const orderFn = options?.sortOrder === "asc" ? asc : desc;

    const limit = options?.limit ?? options?.page_size;
    const offset =
      options?.offset ??
      (options?.page && options?.page_size
        ? (options.page - 1) * options.page_size
        : undefined);

    let query = this.db
      .select()
      .from(seoPartner)
      .where(where)
      .orderBy(orderFn(sortCol));

    if (limit !== undefined) {
      query = query.limit(limit) as typeof query;
    }

    if (offset !== undefined) {
      query = query.offset(offset) as typeof query;
    }

    return query;
  }

  async getPartnersCount(userId: string, options?: ListSeoPartnersOptions) {
    const where = this.buildWhereConditions(userId, options);
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(seoPartner)
      .where(where);
    return Number(result?.count ?? 0);
  }

  async getPartnerById(id: number, userId: string) {
    const [item] = await this.db
      .select()
      .from(seoPartner)
      .where(and(eq(seoPartner.id, id), eq(seoPartner.userId, userId)));
    return item;
  }

  async createPartner(data: CreateSeoPartner, userId: string) {
    const [created] = await this.db
      .insert(seoPartner)
      .values({
        userId,
        website: data.website.trim(),
        url: data.url.trim(),
        contactEmail: data.contactEmail?.trim() || null,
        dr: data.dr ?? null,
        backlinks: data.backlinks ?? null,
        backlinkFor: data.backlinkFor?.trim() || null,
        outreachStatus: data.outreachStatus || ("not_started" as any),
        outreachDate: data.outreachDate ? new Date(data.outreachDate) : null,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        quotedPrice: data.quotedPrice?.trim() || null,
        notes: data.notes?.trim() || null,
        attributes: data.attributes ?? {},
      })
      .returning();
    return created;
  }

  async updatePartner(id: number, data: UpdateSeoPartner, userId: string) {
    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.website !== undefined) updateValues.website = data.website.trim();
    if (data.url !== undefined) updateValues.url = data.url.trim();
    if (data.contactEmail !== undefined)
      updateValues.contactEmail = data.contactEmail ? data.contactEmail.trim() : null;
    if (data.dr !== undefined) updateValues.dr = data.dr;
    if (data.backlinks !== undefined) updateValues.backlinks = data.backlinks;
    if (data.backlinkFor !== undefined)
      updateValues.backlinkFor = data.backlinkFor ? data.backlinkFor.trim() : null;
    if (data.outreachStatus !== undefined)
      updateValues.outreachStatus = data.outreachStatus;
    if (data.outreachDate !== undefined)
      updateValues.outreachDate = data.outreachDate ? new Date(data.outreachDate) : null;
    if (data.followUpDate !== undefined)
      updateValues.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
    if (data.quotedPrice !== undefined)
      updateValues.quotedPrice = data.quotedPrice ? data.quotedPrice.trim() : null;
    if (data.notes !== undefined)
      updateValues.notes = data.notes ? data.notes.trim() : null;
    if (data.attributes !== undefined) updateValues.attributes = data.attributes;

    const [updated] = await this.db
      .update(seoPartner)
      .set(updateValues)
      .where(and(eq(seoPartner.id, id), eq(seoPartner.userId, userId)))
      .returning();
    return updated;
  }

  async deletePartner(id: number, userId: string) {
    const [deleted] = await this.db
      .delete(seoPartner)
      .where(and(eq(seoPartner.id, id), eq(seoPartner.userId, userId)))
      .returning();
    return deleted;
  }

  async batchInsertPartners(
    partnersData: Array<CreateSeoPartner>,
    userId: string,
  ) {
    if (partnersData.length === 0) return [];

    const values = partnersData.map((p) => ({
      userId,
      website: p.website.trim(),
      url: p.url.trim(),
      contactEmail: p.contactEmail?.trim() || null,
      dr: p.dr ?? null,
      backlinks: p.backlinks ?? null,
      backlinkFor: p.backlinkFor?.trim() || null,
      outreachStatus: p.outreachStatus || ("not_started" as any),
      outreachDate: p.outreachDate ? new Date(p.outreachDate) : null,
      followUpDate: p.followUpDate ? new Date(p.followUpDate) : null,
      quotedPrice: p.quotedPrice?.trim() || null,
      notes: p.notes?.trim() || null,
      attributes: p.attributes ?? {},
    }));

    // Cloudflare D1 statement bound parameter limit: <= 100.
    // Each row binds ~14 parameters. BATCH_SIZE=5 ensures <= 70 parameters per statement.
    const BATCH_SIZE = 5;
    if (values.length <= BATCH_SIZE) {
      return this.db.insert(seoPartner).values(values).returning();
    }

    const batchQueries = [];
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      batchQueries.push(
        this.db
          .insert(seoPartner)
          .values(values.slice(i, i + BATCH_SIZE))
          .returning(),
      );
    }

    if (typeof (this.db as any).batch === "function") {
      const batchResults = await (this.db as any).batch(batchQueries as [any, ...any[]]);
      return batchResults.flat() as Array<typeof seoPartner.$inferSelect>;
    }

    const batchResults = await Promise.all(batchQueries);
    return batchResults.flat() as Array<typeof seoPartner.$inferSelect>;
  }

  async getUniqueBacklinkTargets(userId: string): Promise<string[]> {
    const results = await this.db
      .selectDistinct({ backlinkFor: seoPartner.backlinkFor })
      .from(seoPartner)
      .where(
        and(
          eq(seoPartner.userId, userId),
          sql`${seoPartner.backlinkFor} IS NOT NULL AND ${seoPartner.backlinkFor} != ''`,
        ),
      )
      .orderBy(asc(seoPartner.backlinkFor));

    return results
      .map((r) => r.backlinkFor)
      .filter((t): t is string => Boolean(t));
  }

  async getExistingWebsites(userId: string): Promise<Set<string>> {
    const results = await this.db
      .select({ website: seoPartner.website, url: seoPartner.url })
      .from(seoPartner)
      .where(eq(seoPartner.userId, userId));

    const set = new Set<string>();
    for (const r of results) {
      if (r.website) {
        set.add(r.website.toLowerCase().trim().replace(/^www\./, ""));
      }
      if (r.url) {
        try {
          const parsed = new URL(r.url.startsWith("http") ? r.url : `https://${r.url}`);
          set.add(parsed.hostname.toLowerCase().replace(/^www\./, ""));
        } catch {
          set.add(r.url.toLowerCase().trim().replace(/^www\./, ""));
        }
      }
    }
    return set;
  }
}
