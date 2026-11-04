import { z } from "zod";

export const languageSchema = z.enum(["en", "fil", "bis"]);

const feedbackScore = z.number().int().min(1).max(5);

export const feedbackAnswersSchema = z.object({
  ease: feedbackScore,
  findInfo: feedbackScore,
  speed: feedbackScore,
  directions: feedbackScore,
  overall: feedbackScore,
});

export const feedbackSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    email: z.string().email().optional().or(z.literal("")),
    rating: z.number().min(1).max(5).optional(),
    message: z.string().trim().max(2000).default(""),
    category: z.string().optional(),
    answers: feedbackAnswersSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Older kiosks send a written message only; it still has to say something.
    if (!data.answers && data.message.length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["message"],
        message: "Message must be at least 10 characters",
      });
    }
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
  publicOrigin: z.string().url().optional(),
});

export const downloadEmailRequestSchema = z.object({
  downloadId: z.string().min(1),
  email: z.string().email("Please enter a valid email address"),
  lang: languageSchema.default("en"),
  publicOrigin: z.string().url().optional(),
});

export const charterPdfEmailRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  lang: languageSchema.default("en"),
  publicOrigin: z.string().url().optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
