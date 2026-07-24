import { z } from "zod";

export const languageSchema = z.enum(["en", "fil", "bis"]);

export const feedbackSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  rating: z.number().min(1).max(5).optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const serviceSchema = z.object({
  slug: z.string().min(1),
  titleEn: z.string().min(1),
  titleFil: z.string().min(1),
  descriptionEn: z.string().min(1),
  descriptionFil: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const searchSchema = z.object({
  q: z.string().min(1),
  lang: languageSchema.default("en"),
});

export const downloadQrRequestSchema = z.object({
  downloadId: z.string().min(1),
  lang: languageSchema.default("en"),
});

export const downloadEmailRequestSchema = z.object({
  downloadId: z.string().min(1),
  email: z.string().email("Please enter a valid email address"),
  lang: languageSchema.default("en"),
});

export const charterPdfEmailRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  lang: languageSchema.default("en"),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
