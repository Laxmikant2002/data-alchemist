import { z } from 'zod';

export const TaskSchema = z.object({
  TaskID: z.string(),
  TaskName: z.string(),
  Category: z.string(),
  Duration: z.number().int().min(1),
  RequiredSkills: z.array(z.string()),
  PreferredPhases: z.union([
    z.array(z.number().int()),
    z.string().transform((val) => {
      // Accept comma-separated string and parse to array
      if (typeof val === 'string') {
        return val.split(',').map((v) => parseInt(v.trim(), 10)).filter((n) => !isNaN(n));
      }
      return [];
    }),
  ]),
  MaxConcurrent: z.number().int(),
});

export type Task = z.infer<typeof TaskSchema>;
