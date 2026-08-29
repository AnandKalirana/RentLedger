import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendCreated, sendSuccess } from "@/utils/response";
import * as maintenanceService from "@/services/maintenance.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const records = await maintenanceService.listMaintenanceRecords(req.landlord!.id, req.query as any);
  return sendSuccess(res, records);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const record = await maintenanceService.createMaintenanceRecord(req.landlord!.id, req.body);
  return sendCreated(res, record);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const updated = await maintenanceService.updateMaintenanceStatus(
    req.landlord!.id,
    req.params.id,
    status,
    notes
  );
  return sendSuccess(res, updated);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await maintenanceService.deleteMaintenanceRecord(req.landlord!.id, req.params.id);
  return sendSuccess(res, { message: "Maintenance record deleted" });
});
