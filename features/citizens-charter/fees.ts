/**
 * Totals the "Fees to be Paid" column of a charter service.
 *
 * Imported fee cells are free text and often carry bits of neighbouring columns ("None 5 minutes"),
 * ordinance references ("Ordinance No. 2014-11", "Section 210"), per-unit rates ("₱100.00/head")
 * or a choice of prices (seedling types, animals). Only plain amounts are added up; rates are kept
 * as notes, and anything that cannot be totalled honestly is reported as "varies".
 */

export type CharterFeeTotal =
  | { kind: "none" }
  | { kind: "amount"; total: number; rates: string[] }
  | { kind: "varies" };

type StepFee = { kind: "amount"; amount: number; rates: string[] } | { kind: "varies" };

/** True when a fee cell states an actual amount (not "None", a time, or a pointer elsewhere). */
export function isPublishedFeeAmount(raw: string): boolean {
  const fee = raw.trim();
  if (!fee || /^(none|n\/a|free|-|—)$/i.test(fee)) return false;
  if (/^none\b/i.test(fee) && !/(?:₱|php|\d+(?:\.\d+)?\s*(?:pesos?|php))/i.test(fee)) {
    return false;
  }

  if (
    /as reflected/i.test(fee) ||
    /see (?:price list|table|cash slip|steps?|charter)/i.test(fee) ||
    /refer to/i.test(fee)
  ) {
    return false;
  }

  if (/₱|php\.?\s*\d|\bpeso?s?\b/i.test(fee)) return true;
  if (/\d+(?:\.\d{1,2})?\s*(?:\+|\/)\s*\d+/i.test(fee)) return true;
  if (/\d+(?:\.\d{1,2})?(?:\s*(?:\/head|\/ copy|per ))/i.test(fee)) return true;

  return (
    /\d+(?:\.\d{2})\b/.test(fee) &&
    !/(?:minutes?|mins?|hours?|hrs?|days?|calendar|working day)/i.test(fee)
  );
}

/** The fee is published somewhere else (a table, price list or statement of account). */
function pointsElsewhere(raw: string): boolean {
  return /as reflected|see (?:price list|table|cash slip)|table below|refer to/i.test(raw);
}

function withoutReferences(raw: string): string {
  return raw
    .replace(/\([^()]*\)/g, " ")
    .replace(/(?:provincial\s+|sp\s+)?ordinanc\s*e?\s*(?:no\.?)?\s*[\d\s-]*/gi, " ")
    .replace(/revenue code(?: of)?\s*\d*/gi, " ")
    .replace(/section\s*\d+/gi, " ")
    .replace(/\bno\.\s*\d[\d\s-]*/gi, " ")
    .replace(/\d+\s*(?:working\s+days?|calendar\s+days?|days?|hours?|hrs?|minutes?|mins?)\b/gi, " ");
}

const AMOUNT = /\d[\d,]*(?:\.\d+)?/g;
const PER_UNIT = /\/\s*(?:head|hd|sack|copy)|per\s+(?:head|copy|page|sack)|every\s+additional\s+\w+|\bsack\s*\//i;

function amountsIn(text: string): number[] {
  return [...text.matchAll(AMOUNT)]
    .map((match) => Number.parseFloat(match[0].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function unitOf(text: string): string {
  if (/every\s+additional\s+(\w+)/i.test(text)) return `every additional ${text.match(/every\s+additional\s+(\w+)/i)![1].toLowerCase()}`;
  if (/head|\bhd\b/i.test(text)) return "per head";
  if (/sack/i.test(text)) return "per sack";
  if (/copy/i.test(text)) return "per copy";
  if (/page/i.test(text)) return "per page";
  return "per unit";
}

export function formatPeso(value: number): string {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseStepFee(raw: string): StepFee | null {
  if (!isPublishedFeeAmount(raw)) return null;
  const text = withoutReferences(raw);
  // Several labelled fees in one cell (inspection + certification + stamp) are paid together.
  const additive = /\+|\bfees?\b|\bstamp\b/i.test(text);
  const parts = text.includes("+") ? text.split("+") : [text];

  let amount = 0;
  const rates: string[] = [];
  for (const part of parts) {
    const values = amountsIn(part);
    if (values.length === 0) {
      // "50.00 + s for the Documentary Stamp": a charge lost its amount, so a total would be short.
      if (parts.length > 1 && /[a-z]{3,}/i.test(part)) return { kind: "varies" };
      continue;
    }
    if (PER_UNIT.test(part)) {
      if (values.length > 1) return { kind: "varies" };
      rates.push(`${formatPeso(values[0])} ${unitOf(part)}`);
      continue;
    }
    if (values.length > 1 && !additive) return { kind: "varies" };
    amount += values.reduce((sum, value) => sum + value, 0);
  }
  if (amount === 0 && rates.length === 0) return null;
  return { kind: "amount", amount, rates };
}

/** Total of a service's fees, skipping a closing row that only restates the sum so far. */
export function totalCharterFees(fees: string[]): CharterFeeTotal {
  let total = 0;
  const rates: string[] = [];
  let found = false;
  let elsewhere = false;

  for (const raw of fees) {
    const fee = raw.trim();
    if (!fee) continue;
    if (/sub\s*total|^total\b/i.test(fee)) continue;
    const parsed = parseStepFee(fee);
    if (!parsed) {
      if (pointsElsewhere(fee)) elsewhere = true;
      continue;
    }
    if (parsed.kind === "varies") return { kind: "varies" };
    if (found && parsed.rates.length === 0 && Math.abs(parsed.amount - total) < 0.005) continue;
    total += parsed.amount;
    rates.push(...parsed.rates.filter((rate) => !rates.includes(rate)));
    found = true;
  }

  if (!found) return elsewhere ? { kind: "varies" } : { kind: "none" };
  if (elsewhere) return { kind: "varies" };
  return { kind: "amount", total, rates };
}
