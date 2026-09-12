import z from "zod";

export const CreatePlanSchema = z.object({
  goal: z.string().max(255),
  equipment: z.string().max(255),
  availableTime: z.string().max(255),
});