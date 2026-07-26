import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendCreated, sendSuccess } from "@/utils/response";
import * as tenantService from "@/services/tenant.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const tenants = await tenantService.listTenants(req.landlord!.id);
  return sendSuccess(res, tenants);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await tenantService.getTenantById(req.landlord!.id, req.params.id);
  return sendSuccess(res, tenant);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await tenantService.createTenant(req.landlord!.id, req.body);
  return sendCreated(res, tenant);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const tenant = await tenantService.updateTenant(req.landlord!.id, req.params.id, req.body);
  return sendSuccess(res, tenant);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await tenantService.deleteTenant(req.landlord!.id, req.params.id);
  return sendSuccess(res, { message: "Tenant deleted" });
});
