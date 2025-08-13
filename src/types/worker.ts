import { z } from 'zod';

export const WorkerSchema = z.object({
  WorkerID: z.string(),
  WorkerName: z.string(),
  Skills: z.array(z.string()),
  AvailableSlots: z.array(z.number().int()),
  MaxLoadPerPhase: z.number().int(),
  WorkerGroup: z.string(),
  QualificationLevel: z.number().int(),
});

export type Worker = z.infer<typeof WorkerSchema>;
