import { relations } from "drizzle-orm";
import { user } from "./user.schema";
import { session } from "./session.schema";
import { account } from "./account.schema";
import { twoFactor } from "./two-factor.schema";
import { senderIdentity } from "./sender-identity.schema";
import { pitchProfile } from "./pitch-profile.schema";
import { emailList } from "./email-list.schema";
import { email } from "./email.schema";
import { outreachLog } from "./outreach-log.schema";
import { seoPartner } from "./seo-partner.schema";
import { campaign } from "./campaign.schema";
import { campaignQueue } from "./campaign-queue.schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactors: many(twoFactor),
  senderIdentities: many(senderIdentity),
  pitchProfiles: many(pitchProfile),
  emailLists: many(emailList),
  emails: many(email),
  outreachLogs: many(outreachLog),
  seoPartners: many(seoPartner),
  campaigns: many(campaign),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const emailListRelations = relations(emailList, ({ one, many }) => ({
  user: one(user, {
    fields: [emailList.userId],
    references: [user.id],
  }),
  emails: many(email),
}));

export const emailRelations = relations(email, ({ one, many }) => ({
  user: one(user, {
    fields: [email.userId],
    references: [user.id],
  }),
  list: one(emailList, {
    fields: [email.listId],
    references: [emailList.id],
  }),
  outreachLogs: many(outreachLog),
}));

export const senderIdentityRelations = relations(senderIdentity, ({ one, many }) => ({
  user: one(user, {
    fields: [senderIdentity.userId],
    references: [user.id],
  }),
  outreachLogs: many(outreachLog),
}));

export const pitchProfileRelations = relations(pitchProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [pitchProfile.userId],
    references: [user.id],
  }),
  outreachLogs: many(outreachLog),
}));

export const outreachLogRelations = relations(outreachLog, ({ one }) => ({
  user: one(user, {
    fields: [outreachLog.userId],
    references: [user.id],
  }),
  email: one(email, {
    fields: [outreachLog.emailId],
    references: [email.id],
  }),
  sender: one(senderIdentity, {
    fields: [outreachLog.senderId],
    references: [senderIdentity.id],
  }),
  pitchProfile: one(pitchProfile, {
    fields: [outreachLog.pitchProfileId],
    references: [pitchProfile.id],
  }),
}));

export const seoPartnerRelations = relations(seoPartner, ({ one }) => ({
  user: one(user, {
    fields: [seoPartner.userId],
    references: [user.id],
  }),
}));

export const campaignRelations = relations(campaign, ({ one, many }) => ({
  user: one(user, {
    fields: [campaign.userId],
    references: [user.id],
  }),
  list: one(emailList, {
    fields: [campaign.listId],
    references: [emailList.id],
  }),
  sender: one(senderIdentity, {
    fields: [campaign.senderId],
    references: [senderIdentity.id],
  }),
  pitchProfile: one(pitchProfile, {
    fields: [campaign.pitchProfileId],
    references: [pitchProfile.id],
  }),
  queueItems: many(campaignQueue),
}));

export const campaignQueueRelations = relations(campaignQueue, ({ one }) => ({
  campaign: one(campaign, {
    fields: [campaignQueue.campaignId],
    references: [campaign.id],
  }),
  email: one(email, {
    fields: [campaignQueue.emailId],
    references: [email.id],
  }),
}));
