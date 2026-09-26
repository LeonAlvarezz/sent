import { SeoPartnerRepository, type ListSeoPartnersOptions } from "./seo-partner.repository";
import type { CreateSeoPartner, UpdateSeoPartner } from "@z3/types";
import { NotFoundException, BadRequestException } from "@/lib";

export class SeoPartnerService {
  constructor(private readonly repo: SeoPartnerRepository) {}

  async getPartners(userId: string, options?: ListSeoPartnersOptions) {
    const [partners, total] = await Promise.all([
      this.repo.getPartners(userId, options),
      this.repo.getPartnersCount(userId, options),
    ]);
    return { partners, total };
  }

  async getPartnerById(id: number, userId: string) {
    const partner = await this.repo.getPartnerById(id, userId);
    if (!partner) {
      throw new NotFoundException({ message: "SEO Partner not found" });
    }
    return partner;
  }

  async createPartner(data: CreateSeoPartner, userId: string) {
    return this.repo.createPartner(data, userId);
  }

  async batchInsertPartners(partners: CreateSeoPartner[], userId: string) {
    if (!partners || partners.length === 0) {
      throw new BadRequestException({ message: "No SEO partners provided to import" });
    }
    return this.repo.batchInsertPartners(partners, userId);
  }

  async updatePartner(id: number, data: UpdateSeoPartner, userId: string) {
    const updated = await this.repo.updatePartner(id, data, userId);
    if (!updated) {
      throw new NotFoundException({ message: "SEO Partner not found" });
    }
    return updated;
  }

  async deletePartner(id: number, userId: string) {
    const deleted = await this.repo.deletePartner(id, userId);
    if (!deleted) {
      throw new NotFoundException({ message: "SEO Partner not found" });
    }
    return deleted;
  }

  async getUniqueBacklinkTargets(userId: string) {
    return this.repo.getUniqueBacklinkTargets(userId);
  }
}
