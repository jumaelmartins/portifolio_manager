import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const educationSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    institutionName: z.string().trim().min(1, "Institution is required").max(120),
    description: z.string().trim().max(5000).optional(),
    startDate: z.string().regex(datePattern, "Start date is required"),
    endDate: z.string().optional(),
    current: z.boolean(),
  })
  .refine((data) => data.current || Boolean(data.endDate), {
    message: "End date is required when not currently studying here",
    path: ["endDate"],
  });
