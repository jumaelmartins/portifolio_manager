import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const experienceSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    companyName: z.string().trim().min(1, "Company is required").max(120),
    description: z.string().trim().min(1, "Description is required").max(5000),
    startDate: z.string().regex(datePattern, "Start date is required"),
    endDate: z.string().optional(),
    current: z.boolean(),
  })
  .refine((data) => data.current || Boolean(data.endDate), {
    message: "End date is required when not currently working here",
    path: ["endDate"],
  });
