import { z } from 'zod';

export const ClientSchema = z.object({
  ClientID: z.string(),
  ClientName: z.string(),
  PriorityLevel: z.number().int().min(1).max(5),
  RequestedTaskIDs: z.array(z.string()),
  GroupTag: z.string(),
  AttributesJSON: z.record(z.any()),
});

export type Client = z.infer<typeof ClientSchema>;
