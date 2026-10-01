import { OutreachRepository } from "./outreach.repository";
import type {
  CreateEmail,
  CreateEmailList,
  JobTitleItem,
  ListEmailsQuery,
  UpdateEmail,
} from "@z3/types";
import { NotFoundException } from "@/lib";

export class EmailService {
  constructor(private readonly repo: OutreachRepository) {}

  // --- EMAIL LISTS ---
  async getEmailLists(userId: string) {
    return this.repo.getEmailLists(userId);
  }

  async createEmailList(data: CreateEmailList, userId: string) {
    return this.repo.createEmailList(data, userId);
  }

  async deleteEmailList(id: number, userId: string) {
    const deleted = await this.repo.deleteEmailList(id, userId);
    if (!deleted) {
      throw new NotFoundException({ message: "Email list not found" });
    }
    return deleted;
  }

  // --- EMAILS ---
  async getEmails(userId: string, query: ListEmailsQuery) {
    return this.repo.getEmails(userId, query);
  }

  async getEmailsCount(
    userId: string,
    options?: { listId?: number; search?: string; title?: string },
  ) {
    return this.repo.getEmailsCount(userId, options);
  }

  async getJobTitles(userId: string): Promise<JobTitleItem[]> {
    return this.repo.getJobTitles(userId);
  }

  async createEmail(data: CreateEmail, userId: string) {
    return this.repo.createEmail(data, userId);
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
    return this.repo.batchInsertEmails(emailsData, userId, listId);
  }

  async updateEmail(id: number, data: UpdateEmail, userId: string) {
    const updated = await this.repo.updateEmail(id, data, userId);
    if (!updated) {
      throw new NotFoundException({ message: "Email not found" });
    }
    return updated;
  }

  async deleteEmail(id: number, userId: string) {
    const deleted = await this.repo.deleteEmail(id, userId);
    if (!deleted) {
      throw new NotFoundException({ message: "Email not found" });
    }
    return deleted;
  }
}
