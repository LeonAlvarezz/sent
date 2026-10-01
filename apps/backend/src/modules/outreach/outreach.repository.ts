import { and, desc, eq, isNotNull, like, ne, or, sql } from "drizzle-orm";
import type { Database } from "@/db";
import {
  email,
  emailList,
  outreachLog,
  pitchProfile,
  senderIdentity,
  userSettings,
} from "@/db/schema";
import {
  EMAIL_STATUS,
  type CreateEmail,
  type CreateEmailList,
  type CreatePitchProfile,
  type CreateSenderIdentity,
  type JobTitleItem,
  type ListEmailsQuery,
  type UpdateEmail,
  type UpdatePitchProfile,
  type UpdateSenderIdentity,
} from "@z3/types";

export class OutreachRepository {
  constructor(private readonly db: Database) {}

  // --- SENDERS ---
  async getSenders(userId: string) {
    return this.db
      .select({
        id: senderIdentity.id,
        userId: senderIdentity.userId,
        name: senderIdentity.name,
        email: senderIdentity.email,
        host: senderIdentity.host,
        port: senderIdentity.port,
        secure: senderIdentity.secure,
        username: senderIdentity.username,
        isDefault: senderIdentity.isDefault,
        createdAt: senderIdentity.createdAt,
        updatedAt: senderIdentity.updatedAt,
      })
      .from(senderIdentity)
      .where(eq(senderIdentity.userId, userId))
      .orderBy(desc(senderIdentity.createdAt));
  }

  async getSenderWithPassword(id: number, userId: string) {
    const [item] = await this.db
      .select()
      .from(senderIdentity)
      .where(and(eq(senderIdentity.id, id), eq(senderIdentity.userId, userId)));
    return item;
  }

  async createSender(data: CreateSenderIdentity, userId: string) {
    if (data.isDefault) {
      await this.db
        .update(senderIdentity)
        .set({ isDefault: false })
        .where(eq(senderIdentity.userId, userId));
    }
    const [created] = await this.db
      .insert(senderIdentity)
      .values({
        userId,
        name: data.name,
        email: data.email,
        host: data.host,
        port: data.port,
        secure: data.secure ?? false,
        username: data.username,
        password: data.password,
        isDefault: data.isDefault ?? false,
      })
      .returning();
    return created;
  }

  async updateSender(id: number, data: UpdateSenderIdentity, userId: string) {
    if (data.isDefault) {
      await this.db
        .update(senderIdentity)
        .set({ isDefault: false })
        .where(eq(senderIdentity.userId, userId));
    }
    const [updated] = await this.db
      .update(senderIdentity)
      .set(data)
      .where(and(eq(senderIdentity.id, id), eq(senderIdentity.userId, userId)))
      .returning();
    return updated;
  }

  async deleteSender(id: number, userId: string) {
    const [deleted] = await this.db
      .delete(senderIdentity)
      .where(and(eq(senderIdentity.id, id), eq(senderIdentity.userId, userId)))
      .returning();
    return deleted;
  }

  // --- PITCH PROFILES ---
  async getPitchProfiles(userId: string) {
    return this.db
      .select()
      .from(pitchProfile)
      .where(eq(pitchProfile.userId, userId))
      .orderBy(desc(pitchProfile.createdAt));
  }

  async getPitchProfile(id: number, userId: string) {
    const [item] = await this.db
      .select()
      .from(pitchProfile)
      .where(and(eq(pitchProfile.id, id), eq(pitchProfile.userId, userId)));
    return item;
  }

  async getPitchProfileById(id: number, userId: string) {
    return this.getPitchProfile(id, userId);
  }

  async createPitchProfile(data: CreatePitchProfile, userId: string) {
    const [created] = await this.db
      .insert(pitchProfile)
      .values({
        userId,
        name: data.name,
        targetUrl: data.targetUrl,
        valueProposition: data.valueProposition,
        toneInstructions: data.toneInstructions,
        examples: data.examples,
      })
      .returning();
    return created;
  }

  async updatePitchProfile(
    id: number,
    data: UpdatePitchProfile,
    userId: string,
  ) {
    const [updated] = await this.db
      .update(pitchProfile)
      .set(data)
      .where(and(eq(pitchProfile.id, id), eq(pitchProfile.userId, userId)))
      .returning();
    return updated;
  }

  async deletePitchProfile(id: number, userId: string) {
    const [deleted] = await this.db
      .delete(pitchProfile)
      .where(and(eq(pitchProfile.id, id), eq(pitchProfile.userId, userId)))
      .returning();
    return deleted;
  }

  // --- EMAIL LISTS ---
  async getEmailLists(userId: string) {
    const lists = await this.db
      .select({
        id: emailList.id,
        userId: emailList.userId,
        name: emailList.name,
        description: emailList.description,
        createdAt: emailList.createdAt,
        updatedAt: emailList.updatedAt,
        emailCount: sql<number>`count(${email.id})`,
      })
      .from(emailList)
      .leftJoin(email, eq(email.listId, emailList.id))
      .where(eq(emailList.userId, userId))
      .groupBy(emailList.id)
      .orderBy(desc(emailList.createdAt));
    return lists;
  }

  async createEmailList(data: CreateEmailList, userId: string) {
    const [created] = await this.db
      .insert(emailList)
      .values({ ...data, userId })
      .returning();
    return created;
  }

  async deleteEmailList(id: number, userId: string) {
    const [deleted] = await this.db
      .delete(emailList)
      .where(and(eq(emailList.id, id), eq(emailList.userId, userId)))
      .returning();
    return deleted;
  }

  // --- EMAILS ---
  private buildEmailsWhereConditions(
    userId: string,
    options?: { listId?: number; search?: string; title?: string },
  ) {
    const conditions = [eq(email.userId, userId)];
    if (options?.listId) {
      conditions.push(eq(email.listId, options.listId));
    }
    if (options?.title) {
      conditions.push(eq(email.title, options.title));
    }
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        or(
          like(email.email, searchPattern),
          like(email.firstName, searchPattern),
          like(email.lastName, searchPattern),
          like(email.companyName, searchPattern),
          like(email.title, searchPattern),
        )!,
      );
    }
    return and(...conditions);
  }

  async getEmails(userId: string, options: ListEmailsQuery) {
    const where = this.buildEmailsWhereConditions(userId, options);
    const offset = (options.page - 1) * options.page_size;

    const query = this.db.query.email.findMany({
      where,
      limit: options.page_size,
      offset,
      orderBy: desc(email.createdAt),
    });
    return query;
  }

  async getEmailsCount(
    userId: string,
    options?: { listId?: number; search?: string; title?: string },
  ) {
    const where = this.buildEmailsWhereConditions(userId, options);
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(email)
      .where(where);

    return Number(result?.count ?? 0);
  }

  async getJobTitles(userId: string): Promise<JobTitleItem[]> {
    const rows = await this.db
      .select({
        title: email.title,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(email)
      .where(
        and(
          eq(email.userId, userId),
          isNotNull(email.title),
          ne(email.title, ""),
          eq(email.status, EMAIL_STATUS.ACTIVE),
        ),
      )
      .groupBy(email.title)
      .orderBy(desc(sql`count(*)`));

    return rows
      .filter((r) => r.title && r.title.trim().length > 0)
      .map((r) => ({
        title: r.title!.trim(),
        count: Number(r.count),
      }));
  }

  async findEmailByAddress(emailAddress: string, userId: string) {
    const [item] = await this.db
      .select()
      .from(email)
      .where(
        and(
          eq(email.email, emailAddress.toLowerCase().trim()),
          eq(email.userId, userId),
        ),
      );
    return item;
  }

  async createEmail(data: CreateEmail, userId: string) {
    const [created] = await this.db
      .insert(email)
      .values({
        userId,
        listId: data.listId,
        email: data.email.toLowerCase().trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        domainUrl: data.domainUrl,
        title: data.title,
        personLinkedin: data.personLinkedin,
        companyName: data.companyName,
        country: data.country,
        type: data.type,
        companyLinkedin: data.companyLinkedin,
        status: data.status,
        attributes: data.attributes ?? {},
      })
      .returning();
    return created;
  }

  async updateEmail(id: number, data: UpdateEmail, userId: string) {
    const [updated] = await this.db
      .update(email)
      .set(data)
      .where(and(eq(email.id, id), eq(email.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEmail(id: number, userId: string) {
    const [deleted] = await this.db
      .delete(email)
      .where(and(eq(email.id, id), eq(email.userId, userId)))
      .returning();
    return deleted;
  }

  async batchInsertEmails(
    emailsData: Array<{
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      domainUrl?: string | null;
      title?: string | null;
      personLinkedin?: string | null;
      companyName?: string | null;
      country?: string | null;
      type?: string | null;
      companyLinkedin?: string | null;
      attributes?: Record<string, any>;
    }>,
    userId: string,
    listId?: number | null,
  ) {
    if (emailsData.length === 0) return [];
    const values = emailsData.map((e) => ({
      userId,
      listId: listId ?? null,
      email: e.email.toLowerCase().trim(),
      firstName: e.firstName ?? null,
      lastName: e.lastName ?? null,
      domainUrl: e.domainUrl ?? null,
      title: e.title ?? null,
      personLinkedin: e.personLinkedin ?? null,
      companyName: e.companyName ?? null,
      country: e.country ?? null,
      type: e.type ?? null,
      companyLinkedin: e.companyLinkedin ?? null,
      attributes: e.attributes ?? {},
    }));
    // Cloudflare D1 limits each statement to 100 bound parameters.
    // Chunking with BATCH_SIZE=5 ensures <= 80 parameters per statement.
    const BATCH_SIZE = 5;
    if (values.length <= BATCH_SIZE) {
      return this.db.insert(email).values(values).returning();
    }

    const batchQueries = [];
    for (let i = 0; i < values.length; i += BATCH_SIZE) {
      batchQueries.push(
        this.db
          .insert(email)
          .values(values.slice(i, i + BATCH_SIZE))
          .returning(),
      );
    }

    const batchResults = await this.db.batch(batchQueries as [any, ...any[]]);
    return batchResults.flat() as Array<typeof email.$inferSelect>;
  }

  // --- OUTREACH LOGS ---
  async createOutreachLog(data: {
    userId: string;
    emailId?: number | null;
    senderId: number;
    pitchProfileId?: number | null;
    recipientEmail: string;
    subject: string;
    body: string;
    followUpDate?: string | null;
    followUpAction?: any;
  }) {
    const [created] = await this.db
      .insert(outreachLog)
      .values({
        ...data,
        recipientEmail: data.recipientEmail.toLowerCase().trim(),
      })
      .returning();
    return created;
  }

  async getOutreachLogs(userId: string) {
    return this.db
      .select({
        log: outreachLog,
        senderName: senderIdentity.name,
        pitchProfileName: pitchProfile.name,
      })
      .from(outreachLog)
      .leftJoin(senderIdentity, eq(outreachLog.senderId, senderIdentity.id))
      .leftJoin(pitchProfile, eq(outreachLog.pitchProfileId, pitchProfile.id))
      .where(eq(outreachLog.userId, userId))
      .orderBy(desc(outreachLog.sentAt))
      .limit(100);
  }

  // --- USER SETTINGS ---
  async getSettings(userId: string) {
    const [item] = await this.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return item?.settings ?? {};
  }

  async saveSettings(userId: string, settings: Record<string, any>) {
    const existing = await this.getSettings(userId);
    const merged = { ...existing, ...settings };
    const [result] = await this.db
      .insert(userSettings)
      .values({ userId, settings: merged })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { settings: merged },
      })
      .returning();
    return result.settings;
  }
}
