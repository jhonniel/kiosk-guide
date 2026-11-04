import type { Language } from "@/lib/i18n/translations";
import { pickLang } from "@/lib/i18n/translations";

export const FEEDBACK_QUESTION_IDS = ["ease", "findInfo", "speed", "directions", "overall"] as const;

export type FeedbackQuestionId = (typeof FEEDBACK_QUESTION_IDS)[number];

export type FeedbackAnswers = Record<FeedbackQuestionId, number>;

interface FeedbackQuestion {
  id: FeedbackQuestionId;
  en: string;
  fil: string;
  bis: string;
  /** Short label for admin reports. */
  short: string;
}

export const FEEDBACK_QUESTIONS: FeedbackQuestion[] = [
  {
    id: "ease",
    en: "How easy was the kiosk to use?",
    fil: "Gaano kadaling gamitin ang kiosk?",
    bis: "Unsa ka sayon gamiton ang kiosk?",
    short: "Ease of use",
  },
  {
    id: "findInfo",
    en: "How easily did you find the information you needed?",
    fil: "Gaano kadali mong nahanap ang impormasyong kailangan mo?",
    bis: "Unsa ka sayon nimo nakita ang impormasyon nga imong gikinahanglan?",
    short: "Finding information",
  },
  {
    id: "speed",
    en: "How fast did the kiosk respond?",
    fil: "Gaano kabilis tumugon ang kiosk?",
    bis: "Unsa ka paspas mitubag ang kiosk?",
    short: "Speed",
  },
  {
    id: "directions",
    en: "How helpful were the maps and directions?",
    fil: "Gaano nakatulong ang mga mapa at direksyon?",
    bis: "Unsa ka makatabang ang mga mapa ug direksyon?",
    short: "Maps & directions",
  },
  {
    id: "overall",
    en: "How satisfied are you with your overall experience?",
    fil: "Gaano ka nasiyahan sa kabuuan ng iyong karanasan?",
    bis: "Unsa ka matagbaw sa imong tibuok kasinatian?",
    short: "Overall satisfaction",
  },
];

/** Labels for scores 1-5. */
const SCORE_LABELS: Record<number, { en: string; fil: string; bis: string }> = {
  1: { en: "Very poor", fil: "Napakahina", bis: "Luya kaayo" },
  2: { en: "Poor", fil: "Mahina", bis: "Luya" },
  3: { en: "Okay", fil: "Katamtaman", bis: "Okay ra" },
  4: { en: "Good", fil: "Maganda", bis: "Maayo" },
  5: { en: "Excellent", fil: "Napakahusay", bis: "Maayo kaayo" },
};

export function feedbackQuestionText(question: FeedbackQuestion, lang: Language) {
  return pickLang(lang, question.en, question.fil, question.bis);
}

export function feedbackScoreLabel(score: number, lang: Language) {
  const label = SCORE_LABELS[Math.min(5, Math.max(1, Math.round(score)))];
  return pickLang(lang, label.en, label.fil, label.bis);
}

/** English score label for admin reports. */
export function feedbackScoreLabelEn(score: number) {
  return SCORE_LABELS[Math.min(5, Math.max(1, Math.round(score)))].en;
}

/** Overall 1-5 rating kept on the record for existing reports. */
export function averageFeedbackScore(answers: Partial<FeedbackAnswers>) {
  const scores = FEEDBACK_QUESTION_IDS.map((id) => answers[id]).filter(
    (score): score is number => typeof score === "number"
  );
  if (scores.length === 0) return undefined;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/** Read stored answers defensively; older feedback rows have none. */
export function parseFeedbackAnswers(value: unknown): Partial<FeedbackAnswers> {
  if (!value || typeof value !== "object") return {};
  const out: Partial<FeedbackAnswers> = {};
  for (const id of FEEDBACK_QUESTION_IDS) {
    const score = (value as Record<string, unknown>)[id];
    if (typeof score === "number" && score >= 1 && score <= 5) out[id] = score;
  }
  return out;
}
