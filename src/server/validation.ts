import { z } from "zod";
import { rdtiiIndicators } from "./rdtii";

const indicatorIds = rdtiiIndicators.map((indicator) => indicator.id);

export const pillarSchema = z.enum(["pillar-6", "pillar-7"]);
export const sourcePolicySchema = z.enum(["allowlisted_only", "approval_required", "manual_only"]);
export const workspaceStatusSchema = z.enum(["draft", "sources_needed", "ready_to_ingest", "processing", "needs_review", "reviewed", "archived"]);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  economyIds: z.array(z.string().trim().min(1)).min(1),
  activePillars: z.array(pillarSchema).min(1),
  activeIndicatorIds: z.array(z.string()).optional(),
  sourcePolicy: sourcePolicySchema.default("approval_required"),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial().extend({
  status: workspaceStatusSchema.optional(),
});

export const chatSchema = z.object({
  sessionId: z.string().optional(),
  workspaceId: z.string().min(1),
  message: z.string().trim().min(1),
});

export const proposeSourcesSchema = z.object({
  economyId: z.string().optional(),
  pillarIds: z.array(pillarSchema).optional(),
  indicatorIds: z.array(z.string()).optional(),
  query: z.string().optional(),
  maxResults: z.number().int().min(1).max(20).optional(),
});

export const duplicateWorkspaceSchema = z.object({
  mode: z.enum(["config_only", "include_sources", "include_documents", "include_mappings"]).default("config_only"),
}).optional();

export const manualSourceSchema = z.object({
  url: z.string().url(),
  economyId: z.string().optional(),
  title: z.string().trim().optional(),
});

export const reviewMappingSchema = z.object({
  reviewStatus: z.enum(["approved", "rejected"]),
  reviewerNotes: z.string().trim().nullable().optional(),
});

export const scoreOverrideSchema = z.object({
  economyId: z.string().min(1),
  indicatorId: z.string().min(1),
  score: z.union([z.literal(0), z.literal(0.5), z.literal(1)]),
});

export function defaultIndicatorIds(pillars: string[]) {
  return rdtiiIndicators.filter((indicator) => pillars.includes(indicator.pillarId)).map((indicator) => indicator.id);
}

export function validateIndicatorSelection(indicators: string[], pillars: string[]) {
  const allowed = new Set(defaultIndicatorIds(pillars));
  return indicators.length > 0 && indicators.every((id) => indicatorIds.includes(id) && allowed.has(id));
}
