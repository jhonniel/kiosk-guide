import type { Language } from "@/lib/i18n/translations";

/**
 * Detect English / Filipino (Tagalog) / Cebuano (Bisaya) from the user's message.
 * Prefers distinctive markers over shared particles (sa, ang, na, …).
 */
export function detectMessageLanguage(message: string): Language | "mixed" {
  const q = message.toLowerCase().normalize("NFC");

  const strongFil =
    q.match(
      /\b(kumusta|nasaan|saan|paano|ano|sino|bakit|kailan|magtanong|paki|opo|hindi|walang|meron|mayroon|gusto|pwede|puwede|salamat|pasensya|pakisuyo|yung|iyan|iyan|dito|doon|roon|naman|talaga|lamang|baka|siguro|kasi|kaya|parin|ngayon|bukas|kahapon|mahal|libre|bayad|ibigay|sabihin|kwento|kuwento|alam|biro|tulong|pasok|labas|tungkol|tungkol|lamang|lang|po|ho|ba)\b/g
    )?.length ?? 0;

  const softFil =
    (q.match(/\b(ang|ng|ay|nang|ni|kay|para|kung|kapag|mga|ito|iyan|iyon|mo|ko|natin|namin|nila)\b/g)
      ?.length ?? 0) + (/[ñ]/i.test(q) ? 2 : 0);

  const strongBis =
    q.match(
      /\b(asa|unsa|kinsa|unsaon|unsayon|ngano|kanus-a|kanusa|naa|wala|ninyo|inyo|kani|kana|mao|pangutana|pasayloa|maayong|nagaulan|tubag|palihog|karon|ugma|gahapon|sulti|istorya|biro|nahibalo|tabang|bahin|lang|ra)\b/g
    )?.length ?? 0;

  const softBis =
    q.match(/\b(ko|ka|mi|mo|sila|kamo|unya|kay|ug|og|nga|ra|nimo|nako|nato|ninyo)\b/g)?.length ??
    0;

  const strongEn =
    q.match(
      /\b(what|where|when|who|how|why|please|weather|governor|office|emergency|tourism|download|map|hours|contact|festival|attraction|island|province|joke|recipe|poem|translate)\b/g
    )?.length ?? 0;
  const softEn =
    q.match(/\b(the|is|are|can|do|does|will|with|from|about|this|that|me|my|your)\b/g)?.length ?? 0;

  const filScore = strongFil * 3 + softFil;
  const bisScore = strongBis * 3 + softBis * 0.75;
  const enScore = strongEn * 3 + softEn * 0.5;

  if (
    /\b(asa|unsa|kinsa|unsaon|unsayon|ngano|kanus-a|kanusa|maayong|sulti|palihog|bahin)\b/.test(q)
  ) {
    return "bis";
  }
  if (
    /\b(nasaan|saan|paano|ano|sino|bakit|kailan|kumusta|ibigay|sabihin|tungkol)\b/.test(q) &&
    strongBis === 0
  ) {
    return "fil";
  }

  if (filScore >= 2 && filScore >= bisScore && filScore >= enScore) return "fil";
  if (bisScore >= 2 && bisScore >= filScore && bisScore >= enScore) return "bis";
  if (enScore >= 2 && enScore >= filScore && enScore >= bisScore) return "en";

  if (strongFil > 0 && strongFil >= strongBis) return "fil";
  if (strongBis > 0) return "bis";
  if (strongEn > 0) return "en";

  // Soft-only fallback
  if (softFil >= 2 && softFil > softBis && softFil >= softEn) return "fil";
  if (softBis >= 2 && softBis > softFil) return "bis";
  if (softFil >= 1 && softFil > softBis && softEn === 0) return "fil";
  if (softBis >= 1 && softBis > softFil && softEn === 0) return "bis";

  return "mixed";
}

/** Language to answer in: message language wins over kiosk UI language. */
export function resolveReplyLanguage(message: string, uiLanguage: Language): Language {
  const detected = detectMessageLanguage(message);
  if (detected === "fil" || detected === "bis" || detected === "en") return detected;
  return uiLanguage;
}

export function languageLabel(language: Language) {
  if (language === "fil") return "Filipino (Tagalog)";
  if (language === "bis") return "Cebuano (Bisaya)";
  return "English";
}

export function languageReplyInstruction(uiLanguage: Language, message: string) {
  const replyLang = resolveReplyLanguage(message, uiLanguage);
  const ui = languageLabel(uiLanguage);
  const replyIn = languageLabel(replyLang);
  const detected = detectMessageLanguage(message);

  return `Kiosk UI language: ${ui}.
Detected user message language: ${detected === "mixed" ? `unclear → use ${replyIn}` : replyIn}.
You MUST reply entirely in ${replyIn}. Do not switch to English unless the user wrote in English.
If refusing an off-topic question, still refuse in ${replyIn}.
Fully understand Filipino (Tagalog) and Cebuano (Bisaya) questions — including Taglish and Bislish.
Mirror the user's language naturally.`;
}
