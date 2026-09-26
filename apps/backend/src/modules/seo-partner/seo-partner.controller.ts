import type { Context } from "hono";
import * as v from "valibot";
import { SeoPartnerService } from "./seo-partner.service";
import type { SeoPartnerEnv } from "./seo-partner.hono";
import {
  CreateSeoPartnerSchema,
  ImportSeoPartnersPayloadSchema,
  ListSeoPartnersQuerySchema,
  UpdateSeoPartnerSchema,
} from "@z3/types";
import { BadRequestException } from "@/lib";

export class SeoPartnerController {
  constructor(private readonly service: SeoPartnerService) {}

  listPartners = async (c: Context<SeoPartnerEnv>) => {
    const user = c.get("user");
    const rawQuery = {
      search: c.req.query("search") || undefined,
      status: c.req.query("status") || undefined,
      backlinkFor: c.req.query("backlinkFor") || undefined,
      minDr: c.req.query("minDr") ? Number(c.req.query("minDr")) : undefined,
      maxDr: c.req.query("maxDr") ? Number(c.req.query("maxDr")) : undefined,
      limit: c.req.query("limit") ? Number(c.req.query("limit")) : undefined,
      offset: c.req.query("offset") ? Number(c.req.query("offset")) : undefined,
      sortBy: c.req.query("sortBy") || undefined,
      sortOrder: c.req.query("sortOrder") || undefined,
    };

    const parsedQuery = v.parse(ListSeoPartnersQuerySchema, rawQuery);
    const { partners, total } = await this.service.getPartners(user.id, parsedQuery);

    return c.json({
      success: true,
      data: partners,
      total,
    });
  };

  getTargets = async (c: Context<SeoPartnerEnv>) => {
    const user = c.get("user");
    const targets = await this.service.getUniqueBacklinkTargets(user.id);
    return c.json({ success: true, data: targets });
  };

  getPartner = async (c: Context<SeoPartnerEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid ID" });
    }

    const partner = await this.service.getPartnerById(id, user.id);
    return c.json({ success: true, data: partner });
  };

  createPartner = async (c: Context<SeoPartnerEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(CreateSeoPartnerSchema, body);

    const created = await this.service.createPartner(payload, user.id);
    return c.json(
      {
        success: true,
        data: created,
        message: `Partner "${created.website}" created successfully`,
      },
      201,
    );
  };

  batchImport = async (c: Context<SeoPartnerEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(ImportSeoPartnersPayloadSchema, body);

    const inserted = await this.service.batchInsertPartners(payload.partners, user.id);
    return c.json({
      success: true,
      data: inserted,
      message: `Imported ${inserted.length} SEO partners successfully`,
    });
  };

  updatePartner = async (c: Context<SeoPartnerEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid ID" });
    }

    const body = await c.req.json();
    const payload = v.parse(UpdateSeoPartnerSchema, body);

    const updated = await this.service.updatePartner(id, payload, user.id);
    return c.json({
      success: true,
      data: updated,
      message: `Partner "${updated.website}" updated successfully`,
    });
  };

  deletePartner = async (c: Context<SeoPartnerEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid ID" });
    }

    const deleted = await this.service.deletePartner(id, user.id);
    return c.json({
      success: true,
      data: deleted,
      message: `Partner "${deleted.website}" deleted successfully`,
    });
  };
}
