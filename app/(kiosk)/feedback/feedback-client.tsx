"use client";

import { useEffect, useRef, useState } from "react";
import {
  Lock,
  Mail,
  MessageSquareText,
  Send,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useKiosk } from "@/hooks/use-kiosk";
import { useOffline } from "@/components/providers/offline-provider";
import { queueFeedbackEntry, syncQueuedFeedback } from "@/lib/offline/feedback-queue";
import { pickLang } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import {
  FEEDBACK_QUESTIONS,
  averageFeedbackScore,
  feedbackQuestionText,
  feedbackScoreLabel,
  type FeedbackAnswers,
  type FeedbackQuestionId,
} from "@/features/feedback/questions";
import { ContentCard } from "@/components/kiosk/content-card";
import { FeedbackEmoji } from "@/components/kiosk/feedback-emoji";
import { FeedbackRatingSlider } from "@/components/kiosk/feedback-rating-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Scores = Partial<Record<FeedbackQuestionId, number>>;

/** Thank-you screen returns to a fresh form so the next visitor starts clean. */
const THANKS_RESET_MS = 8000;
const COMMENT_LIMIT = 2000;

function OptionalTag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-medium tracking-wide text-slate-500 uppercase">
      {label}
    </span>
  );
}

function IconField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  maxLength,
  placeholder,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </Label>
      <div className="relative mt-1.5">
        <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className="h-11 border-slate-200 bg-slate-50/60 pl-9 text-[0.95rem] focus-visible:bg-white"
        />
      </div>
    </div>
  );
}

export function FeedbackClient() {
  const { language } = useKiosk();
  const { isOnline } = useOffline();
  const [scores, setScores] = useState<Scores>({});
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [thanks, setThanks] = useState<{ score: number } | null>(null);
  const resetTimer = useRef<number | null>(null);

  const total = FEEDBACK_QUESTIONS.length;
  const answeredCount = FEEDBACK_QUESTIONS.filter((q) => scores[q.id] != null).length;
  const complete = answeredCount === total;
  const optionalLabel = pickLang(language, "Optional", "Opsyonal", "Opsyonal");

  const resetForm = () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setScores({});
    setComment("");
    setName("");
    setEmail("");
    setThanks(null);
  };

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    []
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!complete || loading) return;
    setLoading(true);

    const answers = scores as FeedbackAnswers;
    const result = await queueFeedbackEntry({
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      message: comment.trim(),
      rating: averageFeedbackScore(answers),
      category: "kiosk_experience",
      answers,
    });
    if (isOnline) {
      await syncQueuedFeedback();
    }
    setLoading(false);

    if (result.success) {
      toast.success(
        isOnline ? uiText(language, "feedbackThanks") : uiText(language, "feedbackSavedOffline")
      );
      setThanks({ score: averageFeedbackScore(answers) ?? 5 });
      resetTimer.current = window.setTimeout(resetForm, THANKS_RESET_MS);
    }
  }

  if (thanks) {
    return (
      <ContentCard className="w-full">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 py-10 text-center">
          <FeedbackEmoji
            value={Math.max(thanks.score, 4.6)}
            className="feedback-thanks-pop h-28 w-28"
          />
          <h2 className="mt-2 text-2xl font-bold text-kiosk-navy">
            {pickLang(language, "Thank you for your feedback", "Salamat sa iyong feedback", "Salamat sa imong feedback")}
          </h2>
          <p className="max-w-md text-slate-600">
            {pickLang(
              language,
              "Your responses have been recorded and will help us improve this kiosk.",
              "Naitala na ang iyong mga sagot at makakatulong ito para mapabuti ang kiosk.",
              "Natala na ang imong mga tubag ug makatabang kini nga mapaayo ang kiosk."
            )}
          </p>
          <Button
            type="button"
            onClick={resetForm}
            className="mt-3 h-11 min-w-40 bg-kiosk-navy hover:bg-kiosk-navy/90"
          >
            {pickLang(language, "Done", "Tapos", "Human na")}
          </Button>
        </div>
      </ContentCard>
    );
  }

  return (
    <ContentCard className="w-full p-0 sm:p-0 lg:p-0">
      <form onSubmit={handleSubmit} className="@container w-full">
        <div className="px-5 py-5 sm:px-6">
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {FEEDBACK_QUESTIONS.map((question, index) => (
              <FeedbackRatingSlider
                key={question.id}
                number={index + 1}
                question={feedbackQuestionText(question, language)}
                value={scores[question.id] ?? null}
                onChange={(score) => setScores((prev) => ({ ...prev, [question.id]: score }))}
                scoreLabel={(score) => feedbackScoreLabel(score, language)}
                placeholder={pickLang(language, "Not rated", "Wala pang rating", "Wala pay rating")}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-4 @3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section className="flex flex-col rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <Label
                  htmlFor="feedback-comment"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-800"
                >
                  <MessageSquareText className="h-4 w-4 text-kiosk-navy" />
                  {pickLang(language, "Additional comments", "Karagdagang komento", "Dugang nga komento")}
                </Label>
                <OptionalTag label={optionalLabel} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <Textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={COMMENT_LIMIT}
                  rows={4}
                  placeholder={pickLang(
                    language,
                    "Tell us what worked well or what we can improve.",
                    "Sabihin kung ano ang maganda o ano ang dapat pagbutihin.",
                    "Isulti kung unsa ang maayo o unsa ang angay pauswagon."
                  )}
                  className="min-h-32 flex-1 resize-none border-slate-200 bg-slate-50/60 text-[0.95rem] focus-visible:bg-white"
                />
                <p className="mt-2 text-right text-xs text-slate-400 tabular-nums">
                  {comment.length} / {COMMENT_LIMIT}
                </p>
              </div>
            </section>

            <section className="flex flex-col rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <UserRound className="h-4 w-4 text-kiosk-navy" />
                  {pickLang(language, "Contact details", "Impormasyon sa pakikipag-ugnayan", "Detalye sa kontak")}
                </p>
                <OptionalTag label={optionalLabel} />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid gap-4 @xl:grid-cols-2 @3xl:grid-cols-1">
                  <IconField
                    id="feedback-name"
                    label={pickLang(language, "Full name", "Buong pangalan", "Tibuok nga ngalan")}
                    icon={UserRound}
                    value={name}
                    onChange={setName}
                    maxLength={120}
                    placeholder="Juan Dela Cruz"
                  />
                  <IconField
                    id="feedback-email"
                    label={pickLang(language, "Email address", "Email address", "Email address")}
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="name@example.com"
                  />
                </div>
                <p className="mt-auto text-xs leading-relaxed text-slate-500">
                  {pickLang(
                    language,
                    "Leave your details only if you'd like us to follow up with you.",
                    "Ilagay lang ang iyong detalye kung gusto mong makipag-ugnayan kami sa iyo.",
                    "Ibutang lang ang imong detalye kung gusto nimo nga kontakon ka namo."
                  )}
                </p>
              </div>
            </section>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 @3xl:flex-row @3xl:items-center @3xl:justify-between sm:px-6">
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            {pickLang(
              language,
              "Your responses are confidential and only viewed by kiosk administrators.",
              "Kumpidensyal ang iyong mga sagot at ang mga administrator lang ng kiosk ang makakakita.",
              "Kumpidensyal ang imong mga tubag ug ang mga administrator ra sa kiosk ang makakita."
            )}
          </p>
          <Button
            type="submit"
            disabled={!complete || loading}
            className="h-11 gap-2 bg-kiosk-green px-6 text-base font-semibold text-white hover:bg-kiosk-green/90 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100 @3xl:min-w-64"
          >
            <Send className="h-4 w-4" />
            {loading
              ? pickLang(language, "Submitting…", "Ipinapadala…", "Gipadala…")
              : complete
                ? pickLang(language, "Submit feedback", "Ipadala ang feedback", "Ipadala ang feedback")
                : pickLang(
                    language,
                    `Answer all ${total} questions`,
                    `Sagutin ang lahat ng ${total} tanong`,
                    `Tubaga ang tanan nga ${total} ka pangutana`
                  )}
          </Button>
        </footer>
      </form>
    </ContentCard>
  );
}
