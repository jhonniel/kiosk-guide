import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { FeedbackEmoji } from "@/components/kiosk/feedback-emoji";
import {
  FEEDBACK_QUESTIONS,
  feedbackScoreLabelEn,
  parseFeedbackAnswers,
} from "@/features/feedback/questions";
import { cn } from "@/lib/utils";

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ScoreChip({ score }: { score: number | undefined }) {
  if (score == null) return <span className="text-gray-300">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5" title={feedbackScoreLabelEn(score)}>
      <FeedbackEmoji value={score} className="h-6 w-6" />
      <span className="font-semibold text-kiosk-navy">{score}</span>
    </span>
  );
}

export default async function AdminFeedbackPage() {
  await requireAdminPage("manage_feedback");
  const items = await db.feedback.findMany({ orderBy: { createdAt: "desc" } });

  const rows = items.map((item) => ({ ...item, scores: parseFeedbackAnswers(item.answers) }));
  const surveyed = rows.filter((row) => Object.keys(row.scores).length > 0);
  const questionAverages = FEEDBACK_QUESTIONS.map((question) => ({
    question,
    value: average(
      surveyed
        .map((row) => row.scores[question.id])
        .filter((score): score is number => typeof score === "number")
    ),
  }));
  const overallAverage = average(
    rows.map((row) => row.rating).filter((rating): rating is number => typeof rating === "number")
  );

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-kiosk-navy">Feedback</h1>
        <p className="text-gray-500">
          Kiosk experience survey results. Visible to administrators only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Responses</p>
          <p className="mt-1 text-3xl font-bold text-kiosk-navy">{rows.length}</p>
          <p className="text-xs text-gray-400">{surveyed.length} with the 5-question survey</p>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          {overallAverage != null ? <FeedbackEmoji value={overallAverage} className="h-14 w-14 shrink-0" /> : null}
          <div>
            <p className="text-sm font-medium text-gray-500">Average rating</p>
            <p className="mt-1 text-3xl font-bold text-kiosk-navy">
              {overallAverage != null ? overallAverage.toFixed(1) : "—"}
              <span className="text-base font-medium text-gray-400"> / 5</span>
            </p>
            {overallAverage != null ? (
              <p className="text-xs text-gray-400">{feedbackScoreLabelEn(overallAverage)}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-kiosk-navy">Average per question</h2>
        <ul className="space-y-3">
          {questionAverages.map(({ question, value }) => (
            <li key={question.id} className="flex items-center gap-3">
              <div className="w-48 shrink-0 text-sm text-gray-700">{question.short}</div>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-yellow-400 to-green-500"
                  style={{ width: value != null ? `${((value - 1) / 4) * 100}%` : "0%" }}
                />
              </div>
              <div className="flex w-24 shrink-0 items-center justify-end gap-1.5">
                {value != null ? (
                  <>
                    <FeedbackEmoji value={value} className="h-6 w-6" />
                    <span className="text-sm font-semibold text-kiosk-navy">{value.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-300">No data</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Overall</th>
              {FEEDBACK_QUESTIONS.map((question) => (
                <th key={question.id} className="px-4 py-3 text-left font-semibold text-gray-600">
                  {question.short}
                </th>
              ))}
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Comment</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={FEEDBACK_QUESTIONS.length + 4} className="px-4 py-8 text-center text-gray-400">
                  No feedback yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b align-top last:border-0 hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{row.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {row.name || <span className="text-gray-400">Anonymous</span>}
                    {row.email ? <div className="text-xs text-gray-400">{row.email}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreChip score={row.rating ?? undefined} />
                  </td>
                  {FEEDBACK_QUESTIONS.map((question) => (
                    <td key={question.id} className="px-4 py-3">
                      <ScoreChip score={row.scores[question.id]} />
                    </td>
                  ))}
                  <td className={cn("max-w-sm px-4 py-3", !row.message && "text-gray-300")}>
                    {row.message || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
