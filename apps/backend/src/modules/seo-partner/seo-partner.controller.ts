import type { Context } from "hono";
import * as v from "valibot";
import { SeoPartnerService } from "./seo-partner.service";
import type { SeoPartnerEnv } from "./seo-partner.hono";
import {
  CreateSeoPartnerSchema,
  ImportSeoPartnersPayloadSchema,
  ListSeoPartnersQuerySchema,
  UpdateSeoPartnerSchema,
  CompetitorBacklinksQuerySchema,
} from "@z3/types";
import { DataForSeoService } from "./dataforseo.service";
import { BadRequestException } from "@/lib";
import { getMeta } from "@/utils/pagination";

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
      page: c.req.query("page") ? Number(c.req.query("page")) : undefined,
      page_size: c.req.query("page_size")
        ? Number(c.req.query("page_size"))
        : undefined,
      limit: c.req.query("limit") ? Number(c.req.query("limit")) : undefined,
      offset: c.req.query("offset") ? Number(c.req.query("offset")) : undefined,
      sortBy: c.req.query("sortBy") || undefined,
      sortOrder: c.req.query("sortOrder") || undefined,
    };

    const parsedQuery = v.parse(ListSeoPartnersQuerySchema, rawQuery);
    const page = parsedQuery.page ?? 1;
    const page_size = parsedQuery.page_size ?? 10;

    const { partners, total } = await this.service.getPartners(user.id, {
      ...parsedQuery,
      page,
      page_size,
    });

    return c.json({
      partners,
      meta: getMeta({ page, page_size }, total),
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

    const inserted = await this.service.batchInsertPartners(
      payload.partners,
      user.id,
    );
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

  getCompetitorBacklinks = async (c: Context<SeoPartnerEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(CompetitorBacklinksQuerySchema, body);

    console.log({
      login: c.env.DATAFORSEO_LOGIN,
      password: c.env.DATAFORSEO_PASSWORD,
    });

    const dataForSeo = new DataForSeoService(
      c.env.DATAFORSEO_LOGIN,
      c.env.DATAFORSEO_PASSWORD,
    );

    if (!dataForSeo.isConfigured()) {
      return c.json(
        {
          success: false,
          message:
            "DataForSEO environment variables not provided. Please configure DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in backend secrets.",
        },
        400,
      );
    }

    const result = await this.service.getCompetitorBacklinks(
      user.id,
      payload,
      dataForSeo,
    );

    return c.json({
      success: true,
      data: {
        items: result.items,
        total: result.totalCount,
      },
    });
  };
}
