import nodemailer from "nodemailer";
import { OutreachRepository } from "./outreach.repository";
import { BadRequestException, NotFoundException } from "@/lib";
import { EMAIL_STATUS, type DispatchOutreach } from "@z3/types";

export class DispatchService {
  constructor(private readonly repo: OutreachRepository) {}

  async dispatchEmail(payload: DispatchOutreach, userId: string) {
    const sender = await this.repo.getSenderWithPassword(
      payload.senderId,
      userId,
    );
    if (!sender) {
      throw new NotFoundException({ message: "Sender identity not found" });
    }

    // 1. Send via nodemailer
    const transporter = nodemailer.createTransport({
      host: sender.host,
      port: sender.port,
      secure: sender.secure ?? sender.port === 465,
      auth: {
        user: sender.username,
        pass: sender.password,
      },
    });

    try {
      await transporter.sendMail({
        from: `"${sender.name}" <${sender.email}>`,
        to: payload.recipientEmail,
        subject: payload.subject,
        text: payload.body,
      });
    } catch (err: any) {
      throw new BadRequestException({
        message: `Failed to dispatch email via SMTP: ${err.message}`,
      });
    }

    // 2. Ensure Email record exists in DB
    let emailRecord = await this.repo.findEmailByAddress(
      payload.recipientEmail,
      userId,
    );

    if (!emailRecord) {
      emailRecord = await this.repo.createEmail(
        {
          email: payload.recipientEmail,
          firstName: payload.recipientName || null,
          listId: payload.listId || null,
          status: EMAIL_STATUS.ACTIVE,
          attributes: {},
        },
        userId,
      );
    }

    // 3. Record Outreach Log
    const log = await this.repo.createOutreachLog({
      userId,
      emailId: emailRecord?.id || null,
      senderId: sender.id,
      pitchProfileId: payload.pitchProfileId || null,
      recipientEmail: payload.recipientEmail,
      subject: payload.subject,
      body: payload.body,
      followUpDate: payload.followUpDate || null,
      followUpAction: payload.followUpAction || null,
    });

    return {
      success: true,
      logId: log.id,
      message: "Outreach email sent successfully",
    };
  }
}
