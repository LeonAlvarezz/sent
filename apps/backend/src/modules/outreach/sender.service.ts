import nodemailer from "nodemailer";
import { OutreachRepository } from "./outreach.repository";
import type { CreateSenderIdentity, UpdateSenderIdentity } from "@z3/types";
import { BadRequestException } from "@/lib";

export class SenderService {
  constructor(private readonly repo: OutreachRepository) {}

  async getSenders(userId: string) {
    return this.repo.getSenders(userId);
  }

  async testConnection(config: {
    host: string;
    port: number;
    secure?: boolean;
    username: string;
    password: string;
  }) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure ?? (config.port === 465),
        auth: {
          user: config.username,
          pass: config.password,
        },
        connectionTimeout: 8000,
      });

      await transporter.verify();
      return { success: true, message: "SMTP connection verified successfully" };
    } catch (error: any) {
      throw new BadRequestException({
        message: `SMTP verification failed: ${error.message}`,
      });
    }
  }

  async createSender(data: CreateSenderIdentity, userId: string) {
    // Verify connection first before saving
    await this.testConnection(data);
    return this.repo.createSender(data, userId);
  }

  async updateSender(id: number, data: UpdateSenderIdentity, userId: string) {
    if (data.host && data.username && data.password && data.port) {
      await this.testConnection({
        host: data.host,
        port: data.port,
        secure: data.secure,
        username: data.username,
        password: data.password,
      });
    }
    return this.repo.updateSender(id, data, userId);
  }

  async deleteSender(id: number, userId: string) {
    return this.repo.deleteSender(id, userId);
  }
}
