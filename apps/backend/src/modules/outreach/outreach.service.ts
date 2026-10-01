import { OutreachRepository } from "./outreach.repository";

export class OutreachService {
  constructor(private readonly repo: OutreachRepository) {}

  async getLogs(userId: string) {
    return this.repo.getOutreachLogs(userId);
  }

  async getSettings(userId: string) {
    return this.repo.getSettings(userId);
  }

  async saveSettings(userId: string, settings: Record<string, any>) {
    return this.repo.saveSettings(userId, settings);
  }

  async getAiStatus(userId: string, envApiKey?: string) {
    const settings = await this.repo.getSettings(userId);
    const hasEnvKey = Boolean(envApiKey?.trim());
    const hasDbKey = Boolean(settings?.openaiApiKey?.trim());

    return {
      isConfigured: hasEnvKey || hasDbKey,
      source: (hasEnvKey ? "env" : hasDbKey ? "db" : "none") as
        | "env"
        | "db"
        | "none",
    };
  }
}
