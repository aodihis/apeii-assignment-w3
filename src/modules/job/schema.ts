import z from "zod";

export const CreateStudyGuideSchema = z.object({
  subject: z.string().min(1).max(255),
  topic: z.string().min(1).max(255),
  level: z.string().min(1).max(255),
  availableTime: z.string().max(255),
});
