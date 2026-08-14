/**
 * PDF extraction often merges Classification / Type of Transaction / Who may avail
 * into one blob. Split those fields for display without requiring a re-import.
 */

export type CharterMetaFields = {
  classification: string;
  typeOfTransaction: string;
  whoMayAvail: string;
  officeOrDivision: string;
  description: string;
};

function cleanSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripTrailingTransactionLabel(value: string) {
  return cleanSpaces(value.replace(/\s*Transaction:\s*$/i, ""));
}

/** Prefer a short badge label like "Simple" / "Highly Technical (Multi Stage)". */
export function shortClassificationLabel(classification: string) {
  const value = cleanSpaces(classification);
  if (!value) return "";
  const match = value.match(
    /^(Simple|Complex|Highly Technical)(?:\s*\(([^)]+)\))?/i
  );
  if (!match) {
    return value.length > 42 ? `${value.slice(0, 42).trim()}…` : value;
  }
  const base = match[1];
  const detail = match[2]?.trim();
  return detail ? `${base} (${detail})` : base;
}

export function normalizeCharterMetaFields(input: {
  classification?: string | null;
  typeOfTransaction?: string | null;
  whoMayAvail?: string | null;
  officeOrDivision?: string | null;
  description?: string | null;
}): CharterMetaFields {
  let classification = cleanSpaces(input.classification ?? "");
  let typeOfTransaction = cleanSpaces(input.typeOfTransaction ?? "");
  let whoMayAvail = cleanSpaces(input.whoMayAvail ?? "");
  let officeOrDivision = cleanSpaces(input.officeOrDivision ?? "");
  let description = cleanSpaces(input.description ?? "");

  // "Office or … Division:" sometimes stuck in the description.
  if (!officeOrDivision) {
    const officeMatch = description.match(
      /Office or\s+(.+?)\s+Division:\s*/i
    );
    if (officeMatch) {
      officeOrDivision = cleanSpaces(officeMatch[1]);
      description = cleanSpaces(description.slice(0, officeMatch.index ?? 0));
    }
  }

  const looksMerged =
    /Type of|Who may|Transaction:|Service\/Transaction:/i.test(classification);

  if (looksMerged) {
    // "Who may X avail: Y" (words between Who may and avail)
    const whoSplit = classification.match(/\sWho may\s+(.+?)\s+avail:\s*(.+)$/i);
    if (whoSplit && whoSplit.index != null) {
      if (!whoMayAvail) {
        whoMayAvail = cleanSpaces(`${whoSplit[1]}; ${whoSplit[2]}`);
      }
      classification = cleanSpaces(classification.slice(0, whoSplit.index));
    } else {
      const whoAvail = classification.match(/\sWho may avail:\s*(.+)$/i);
      if (whoAvail && whoAvail.index != null) {
        if (!whoMayAvail) whoMayAvail = cleanSpaces(whoAvail[1]);
        classification = cleanSpaces(classification.slice(0, whoAvail.index));
      }
    }

    // "… Type of … Transaction: …"
    const typeOf = classification.match(
      /^(.*?)(?:\s+Type of\s+|\s+Service\/Transaction:\s*)(.+)$/i
    );
    if (typeOf) {
      classification = cleanSpaces(typeOf[1]);
      const extracted = stripTrailingTransactionLabel(
        typeOf[2].replace(/\s*Transaction:\s*/gi, " ")
      );
      if (!typeOfTransaction) typeOfTransaction = extracted;
    } else if (/G2[CBG]/i.test(classification) && !/^(Simple|Complex|Highly Technical)/i.test(classification)) {
      // e.g. "Multi Stage G2G- …" with no "Type of"
      if (!typeOfTransaction) typeOfTransaction = classification;
      const classOnly = classification.match(/^(Multi Stage)\b/i);
      classification = classOnly ? classOnly[1] : "";
    }
  }

  // Classification still has leftover G2* codes — move them to type.
  if (/G2[CBG]/i.test(classification) && /^(Simple|Complex|Highly Technical)/i.test(classification)) {
    const split = classification.match(
      /^(Simple|Complex|Highly Technical(?:\s*\([^)]+\))?)\s+(.+)$/i
    );
    if (split) {
      classification = cleanSpaces(split[1]);
      const rest = stripTrailingTransactionLabel(split[2].replace(/^Type of\s+/i, ""));
      if (rest && !typeOfTransaction) typeOfTransaction = rest;
      else if (rest) typeOfTransaction = cleanSpaces(`${typeOfTransaction} ${rest}`);
    }
  }

  classification = shortClassificationLabel(classification) || classification;

  return {
    classification,
    typeOfTransaction,
    whoMayAvail,
    officeOrDivision,
    description,
  };
}
