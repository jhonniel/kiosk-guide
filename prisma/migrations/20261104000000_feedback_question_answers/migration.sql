-- Per-question kiosk experience scores (1-5), keyed by question id.
ALTER TABLE "Feedback" ADD COLUMN "answers" JSONB;
