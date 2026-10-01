import { OutreachRepository } from "./outreach.repository";
import type { CreatePitchProfile, UpdatePitchProfile } from "@z3/types";
import { NotFoundException } from "@/lib";

export class PitchProfileService {
  constructor(private readonly repo: OutreachRepository) {}

  async getPitchProfiles(userId: string) {
    return this.repo.getPitchProfiles(userId);
  }

  async getPitchProfile(id: number, userId: string) {
    const profile = await this.repo.getPitchProfile(id, userId);
    if (!profile) {
      throw new NotFoundException({ message: "Pitch profile not found" });
    }
    return profile;
  }

  async createPitchProfile(data: CreatePitchProfile, userId: string) {
    return this.repo.createPitchProfile(data, userId);
  }

  async updatePitchProfile(
    id: number,
    data: UpdatePitchProfile,
    userId: string,
  ) {
    const updated = await this.repo.updatePitchProfile(id, data, userId);
    if (!updated) {
      throw new NotFoundException({ message: "Pitch profile not found" });
    }
    return updated;
  }

  async deletePitchProfile(id: number, userId: string) {
    const deleted = await this.repo.deletePitchProfile(id, userId);
    if (!deleted) {
      throw new NotFoundException({ message: "Pitch profile not found" });
    }
    return deleted;
  }
}
