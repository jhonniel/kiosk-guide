/* One-shot generator: parses the 2026 Citizens' Charter PDF text and emits
   features/citizens-charter/requirements-2026.ts (checklist of requirements +
   where to secure, keyed by charter page number).

   After the editable admin Charter module, this file is an IMPORT SOURCE ONLY.
   Do not treat the generated TypeScript as the live kiosk data source — the
   kiosk reads the PUBLISHED CharterEdition from the database. Re-running this
   script refreshes the static seed input used by importCitizensCharterFromStatic. */
import { readFileSync, writeFileSync } from "node:fs";
import { CITIZENS_CHARTER_SERVICE_GROUPS } from "../features/citizens-charter/services-2026";

const lines = readFileSync("/tmp/charter.txt", "utf8").split("\n");

interface FlatService {
  office: string;
  name: string;
  page: number;
}
const flat: FlatService[] = [];
for (const g of CITIZENS_CHARTER_SERVICE_GROUPS)
  for (const c of g.categories)
    for (const s of c.services) flat.push({ office: g.office, name: s.name, page: s.page });

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Locate checklist headers (anchor on WHERE TO SECURE; header may wrap)
const headerIdx: number[] = [];
lines.forEach((l, i) => {
  if (/WHERE TO SECURE/.test(l)) headerIdx.push(i);
});

const endRe =
  /CLIENT\s+STEPS|\bAGENCY\b.*\b(ACTIONS?|FEES|PROCESSING)\b|\bFEES\s+TO\s+BE\b|^\s*(FEES|AGENCY|CLIENT)\s*$/;

interface Item {
  requirement: string;
  whereToSecure: string;
  isSection?: boolean;
}

interface StepRow {
  step: string;
  action: string;
  fee: string;
  time: string;
  person: string;
}

interface ServiceMeta {
  description: string;
  officeOrDivision: string;
  classification: string;
  typeOfTransaction: string;
  whoMayAvail: string;
}

interface MedicineRow {
  name: string;
  preparation: string;
  brand: string;
  price: string;
  isSection?: boolean;
}

const META_LABELS = [
  "Office or Division",
  "Classification",
  "Type of Transaction",
  "Who may avail",
] as const;

function parseMeta(blockStart: number): ServiceMeta {
  // Walk back from checklist header to the service title, collecting the
  // metadata table and the description paragraph above it.
  let titleIdx = -1;
  for (let i = blockStart - 1; i > Math.max(0, blockStart - 80); i--) {
    if (/^\s{0,10}\d{1,2}[.)]?\s+[A-Z]/.test(lines[i]) && findServiceByLine(lines[i])) {
      titleIdx = i;
      break;
    }
  }

  const regionStart = titleIdx >= 0 ? titleIdx : Math.max(0, blockStart - 40);
  const region = lines.slice(regionStart, blockStart);

  const fields: Record<(typeof META_LABELS)[number], string[]> = {
    "Office or Division": [],
    Classification: [],
    "Type of Transaction": [],
    "Who may avail": [],
  };
  let current: (typeof META_LABELS)[number] | null = null;
  let metaStarted = false;
  let pastTitle = titleIdx < 0;
  const descParts: string[] = [];

  for (const raw of region) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (/^\d{1,3}$/.test(trimmed)) continue;
    if (/CHECKLIST OF REQUIREMENTS|WHERE TO SECURE/i.test(trimmed)) break;

    let matchedLabel = false;
    for (const label of META_LABELS) {
      const re = new RegExp(`^\\s*${label}\\s*:\\s*(.*)$`, "i");
      const m = trimmed.match(re);
      if (m) {
        current = label;
        metaStarted = true;
        pastTitle = true;
        matchedLabel = true;
        if (m[1].trim()) fields[label].push(m[1].trim());
        break;
      }
    }
    if (matchedLabel) continue;

    if (metaStarted && current && !/^\d{1,2}[.)]?\s+[A-Z]/.test(trimmed)) {
      fields[current].push(trimmed);
      continue;
    }

    if (!pastTitle) {
      if (/^\s{0,10}\d{1,2}[.)]?\s+[A-Z]/.test(raw)) continue;
      // Skip title wrap lines (no sentence start yet)
      if (
        !/^(This|These|The)\b/i.test(trimmed) &&
        !/[.!?]$/.test(trimmed) &&
        trimmed.length < 90
      ) {
        continue;
      }
      pastTitle = true;
    }

    if (!metaStarted && !/^\d{1,2}[.)]?\s+[A-Z]/.test(trimmed)) {
      descParts.push(trimmed);
    }
  }

  return {
    description: descParts.join(" ").replace(/\s+/g, " ").trim(),
    officeOrDivision: fields["Office or Division"].join(" ").replace(/\s+/g, " ").trim(),
    classification: fields.Classification.join(" ").replace(/\s+/g, " ").trim(),
    typeOfTransaction: fields["Type of Transaction"].join(" ").replace(/\s+/g, " ").trim(),
    whoMayAvail: fields["Who may avail"].join(" ").replace(/\s+/g, " ").trim(),
  };
}

const HEADER_TOKEN_RE =
  /^(CLIENT|STEPS?|AGENCY|AGENCY ACTIONS?|ACTIONS?|FEES?|TO BE|TO|BE|NG|PAID|PROCESSING|PROCESSI|NG TIME|TIME|PERSON|RESPONSIBLE|RESPONSIB|LE|BE PAID|FEES TO|CLIENT STEPS)[\s]*$/;

function isHeaderOnlyLine(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  return t
    .split(/\s{2,}/)
    .every((part) => HEADER_TOKEN_RE.test(part.trim()) || /^FEES TO$/.test(part.trim()));
}

const stepsEndRe =
  /Office or Division:|CHECKLIST OF|FEEDBACK AND COMPLAINT|WHERE TO SECURE|List of Medicine available|^\s*TOTAL:/i;

function parseSteps(headerStart: number): { rows: StepRow[]; end: number } {
  // Gather column positions from up to 5 header lines
  let posAgency = -1;
  let posFees = -1;
  let posTime = -1;
  let posPerson = -1;
  let i = Math.max(0, headerStart - 2);
  const headerLimit = Math.min(lines.length, headerStart + 6);
  for (; i < headerLimit; i++) {
    const raw = lines[i];
    if (posAgency < 0) posAgency = raw.indexOf("AGENCY");
    if (posAgency < 0) posAgency = raw.indexOf("ACTIONS");
    if (posFees < 0) posFees = raw.indexOf("FEES");
    if (posFees < 0) posFees = raw.indexOf("TO BE");
    if (posFees < 0) posFees = raw.indexOf("PAID");
    if (posTime < 0) posTime = raw.indexOf("PROCESSI");
    if (posTime < 0 && raw.indexOf("TIME") > posFees + 3) posTime = raw.indexOf("TIME");
    if (posPerson < 0) posPerson = raw.indexOf("PERSON");
    if (posPerson < 0) posPerson = raw.indexOf("RESPONSIB");
    if (!isHeaderOnlyLine(raw) && i >= headerStart + 1) break;
  }
  if (posAgency < 0 || posPerson < 0) return { rows: [], end: headerStart + 1 };
  if (posFees < 0) posFees = Math.floor((posAgency + (posTime > 0 ? posTime : posPerson)) / 2);
  if (posTime < 0) posTime = Math.floor((posFees + posPerson) / 2);

  const centers = [2, posAgency, posFees, posTime, posPerson];

  const rows: StepRow[] = [];
  let cur: StepRow | null = null;

  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (stepsEndRe.test(raw)) break;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (/^\d{1,3}$/.test(trimmed)) continue; // page number
    if (isHeaderOnlyLine(raw)) continue;
    // TOTAL precursor line (e.g. "See        55 minutes") with no step content
    if (/^See\b/i.test(trimmed) && /\d+\s+minutes?/i.test(trimmed) && !/^\d/.test(trimmed)) break;
    // Next service heading = end
    if (/^\s{0,10}\d{1,2}[.)]\s+[A-Z]/.test(raw) && findServiceByLine(raw)) break;

    // Split into fragments on 2+ space gaps, keeping start positions,
    // then assign each fragment to the nearest header column.
    const cells = ["", "", "", "", ""];
    const fragRe = /\S(?:.*?\S)??(?=\s{2,}|\s*$)/g;
    let fm: RegExpExecArray | null;
    while ((fm = fragRe.exec(raw))) {
      const text = fm[0];
      if (!text.trim()) continue;
      const start = fm.index;
      let col = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const dist = Math.abs(start - centers[c]);
        if (dist < bestDist) {
          bestDist = dist;
          col = c;
        }
      }
      cells[col] = cells[col] ? `${cells[col]} ${text.trim()}` : text.trim();
      fragRe.lastIndex = fm.index + text.length;
    }

    const [c0, c1, c2, c3, c4] = cells;
    const newClientStep = /^\d{1,2}[.)]\s*\S/.test(c0);
    const newAction = /^\d{1,2}\.\s?\d{1,2}/.test(c1);

    if (newClientStep || newAction) {
      if (cur) rows.push(cur);
      cur = { step: c0, action: c1, fee: c2, time: c3, person: c4 };
    } else if (cur) {
      if (c0) cur.step += ` ${c0}`;
      if (c1) cur.action += ` ${c1}`;
      if (c2) cur.fee += ` ${c2}`;
      if (c3) cur.time += ` ${c3}`;
      if (c4) cur.person += ` ${c4}`;
    } else if (c0 || c1) {
      cur = { step: c0, action: c1, fee: c2, time: c3, person: c4 };
    }
  }
  if (cur) rows.push(cur);
  return { rows, end: i };
}

function findServiceByLine(raw: string): FlatService | null {
  const m = raw.match(/^\s{0,10}(\d{1,2})[.)]?\s+([A-Z].*)$/);
  if (!m) return null;
  const candidate = norm(m[2]);
  if (candidate.length < 10) return null;
  for (const s of flat) {
    const target = norm(s.name);
    if (dice(candidate.slice(0, target.length + 12), target) >= 0.6) return s;
  }
  return null;
}

const PREP_TOKEN =
  "(?:tablets?|ampoules?|bottles?|capsules?|vials?|tubes?|nebules?|pcs|boxes|set|Tin|prefilled(?:\\s+syringe)?|syringes?|sachets?|packs?|box|units?|pairs?|rolls?|kits?)";
const PREP_COL_RE = new RegExp(`(\\s{2,})(${PREP_TOKEN})\\b`, "i");
const PREP_START_RE = new RegExp(`^(${PREP_TOKEN})\\b`, "i");
const PRICE_RE = /(\d+\.\d{2})\s*$/;

function isMedicineNameContinuation(text: string): boolean {
  if (!text) return false;
  if (text[0] === text[0].toLowerCase() && /[a-z]/.test(text[0])) return true;
  if (/^[\d./]+\s*[a-zA-Z]{0,4}$/.test(text)) return true;
  if (/^\d+\.\d+$/.test(text)) return true;
  return false;
}

function isBrandOnlyLine(text: string): boolean {
  if (PREP_COL_RE.test(text) || PREP_START_RE.test(text) || PRICE_RE.test(text)) return false;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (!letters) return false;
  const upper = [...letters].filter((c) => c === c.toUpperCase()).length;
  return upper / letters.length >= 0.7 && text.length <= 40;
}

function parseMedicineDataLine(
  t: string
): { name: string; preparation: string; brand: string; price: string } | null {
  let price = "";
  const mprice = t.match(PRICE_RE);
  let body = t;
  if (mprice) {
    price = mprice[1];
    body = t.slice(0, mprice.index).trimEnd();
  }

  // Continuation rows that begin with the preparation column
  const startPrep = body.match(PREP_START_RE);
  if (startPrep) {
    return {
      name: "",
      preparation: startPrep[1],
      brand: body.slice(startPrep[0].length).trim(),
      price,
    };
  }

  const matches = [...body.matchAll(new RegExp(PREP_COL_RE.source, "gi"))];
  if (!matches.length) return null;
  const m = matches[matches.length - 1];
  const idx = m.index ?? 0;
  return {
    name: body.slice(0, idx).trim(),
    preparation: m[2],
    brand: body.slice(idx + m[0].length).trim(),
    price,
  };
}

/** Hospital medicine / supplies price list that follows the Dispensing service. */
function parseMedicineList(): MedicineRow[] {
  const start = lines.findIndex((l) => /List of Medicine available/i.test(l));
  if (start < 0) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*\d{1,2}\.\s+[A-Z]/.test(lines[i]) && /Emergency/i.test(lines[i])) {
      end = i;
      break;
    }
  }

  const rows: MedicineRow[] = [];
  let pendingName = "";
  let lastFullName = "";
  let lastPrep = "";

  const emit = (name: string, preparation: string, brand: string, price: string) => {
    let prep = preparation;
    if (!prep && name === lastFullName && lastPrep) prep = lastPrep;
    rows.push({ name, preparation: prep, brand, price });
    lastFullName = name;
    if (prep) lastPrep = prep;
  };

  for (let i = start + 2; i < end; i++) {
    const t = lines[i].trim();
    if (!t || /^\d{1,3}$/.test(t)) continue;
    if (/^Name of Drugs/i.test(t) || /List of Medicine/i.test(t)) continue;

    if (/^ADMISSION KITS$/i.test(t)) {
      pendingName = "";
      rows.push({ name: "ADMISSION KITS", preparation: "", brand: "", price: "", isSection: true });
      continue;
    }
    if (/^SET\s+\d+/i.test(t)) {
      pendingName = "";
      const m = t.match(/^(SET\s+\d+\s+Admission Kit)\s+(\S+)?$/i);
      emit(m?.[1] ?? t, m?.[2] ?? "set", "", "");
      continue;
    }

    const parsed = parseMedicineDataLine(t);
    if (parsed) {
      let { name, preparation, brand, price } = parsed;
      if (!name) name = pendingName || lastFullName;
      else if (isMedicineNameContinuation(name) && pendingName) {
        name = `${pendingName} ${name}`.trim();
      }
      if (!name) continue;
      emit(name, preparation, brand, price);
      pendingName = name;
      continue;
    }

    if (isBrandOnlyLine(t) && lastFullName) {
      emit(lastFullName, lastPrep, t, "");
      continue;
    }

    if (isMedicineNameContinuation(t)) {
      if (pendingName) {
        pendingName = `${pendingName} ${t}`.trim();
        const last = rows[rows.length - 1];
        if (last && !last.isSection && last.name !== pendingName) {
          if (pendingName.startsWith(last.name) || last.name.includes(pendingName.split(" ")[0])) {
            last.name = pendingName;
            lastFullName = pendingName;
          }
        }
      } else if (rows.length && !rows[rows.length - 1].isSection) {
        const last = rows[rows.length - 1];
        last.name = `${last.name} ${t}`.trim();
        lastFullName = last.name;
        pendingName = lastFullName;
      }
      continue;
    }

    if (!PREP_COL_RE.test(t) && !PRICE_RE.test(t) && !PREP_START_RE.test(t)) {
      pendingName = t;
      continue;
    }

    // Fallback: prep with a single space + trailing price (supplies section)
    const m = t.match(new RegExp(`\\s+(${PREP_TOKEN})\\b`, "i"));
    const p = t.match(PRICE_RE);
    if (m && p) {
      const name = t.slice(0, m.index).trim() || pendingName || lastFullName;
      const preparation = m[1];
      const rest = t.slice((m.index ?? 0) + m[0].length);
      const brand = rest.replace(PRICE_RE, "").trim();
      emit(name, preparation, brand, p[1]);
      pendingName = name;
    }
  }

  return rows.filter(
    (r) => r.isSection || r.preparation || r.brand || r.price || (r.name && r.name.length > 3)
  );
}

const BULLET_RE = /^(\d{1,2}[.)]|[●•‣▪○⮚➢▶►□■]|-)\s+/;
const SECTION_RE =
  /^((?:COMMON |SITUATIONAL |ADDITIONAL )?REQUIREMENTS?(?:\s*\([^)]*\))?|FOR\s+[A-Z][A-Z\s/()-]+)\s*:?\s*$/i;

function parseBlock(start: number): { items: Item[]; end: number } {
  // Prefer the column under WHERE TO SECURE; fall back to a typical mid-page split
  // when the header is wrapped across lines (CHECKLIST OF / WHERE TO SECURE).
  let colStart = lines[start].indexOf("WHERE TO SECURE");
  if (colStart < 0) {
    for (let j = Math.max(0, start - 3); j <= start + 2; j++) {
      const idx = lines[j]?.indexOf("WHERE TO SECURE") ?? -1;
      if (idx >= 0) {
        colStart = idx;
        break;
      }
    }
  }
  if (colStart < 0) colStart = 40;

  const items: Item[] = [];
  let cur: Item | null = null;
  // Some pages lose their bullet glyphs in text extraction; in those blocks we
  // fall back to phrase-completeness heuristics to split items.
  let sawBullet = false;
  let i = start + 1;
  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (endRe.test(raw)) break;
    if (/CHECKLIST OF|WHERE TO SECURE/i.test(raw) && !BULLET_RE.test(raw.trim())) continue;
    const trimmed = raw.trim();
    if (!trimmed || /^\d+$/.test(trimmed)) continue;
    // Lone "REQUIREMENTS" under the checklist header (not a section label with items)
    if (/^REQUIREMENTS$/i.test(trimmed) && !items.length && !cur) continue;

    // Split at the WHERE TO SECURE column, preferring a 2+ space gap
    let left = raw;
    let right = "";
    if (raw.length > colStart - 14) {
      let split = -1;
      const searchFrom = Math.max(0, colStart - 14);
      const gap = /\s{2,}/g;
      let m: RegExpExecArray | null;
      while ((m = gap.exec(raw))) {
        const gapEnd = m.index + m[0].length;
        if (gapEnd >= searchFrom && m.index <= colStart + 6) split = gapEnd;
        if (m.index > colStart + 6) break;
      }
      // Also catch bullets that leave a large gap even if colStart is off
      if (split < 0) {
        const loose = raw.match(/^(.{10,}?)\s{3,}(\S.*)$/);
        if (loose) {
          left = loose[1];
          right = loose[2];
          split = loose[1].length;
        }
      }
      if (split > 0 && !right) {
        left = raw.slice(0, split);
        right = raw.slice(split);
      }
    }
    const l = left.trim();
    const r = right.trim();

    // Section headers like "REQUIREMENTS:" / "SITUATIONAL REQUIREMENTS:"
    // may share a line with the first bullet — split them apart.
    const sectionInline = l.match(
      /^((?:REQUIREMENTS|SITUATIONAL REQUIREMENTS|ADDITIONAL REQUIREMENTS(?:\s*\([^)]*\))?)\s*:)\s*(.*)$/i
    );
    if (sectionInline) {
      if (cur) {
        items.push(cur);
        cur = null;
      }
      items.push({ requirement: sectionInline[1].replace(/:$/, "").trim(), whereToSecure: "", isSection: true });
      const rest = sectionInline[2].trim();
      if (rest) {
        const restIsBullet = BULLET_RE.test(rest);
        cur = {
          requirement: restIsBullet ? rest.replace(BULLET_RE, "") : rest,
          whereToSecure: r,
        };
      }
      continue;
    }

    if (SECTION_RE.test(l) || /^(ADDITIONAL REQUIREMENTS)\b/i.test(l)) {
      if (cur) {
        items.push(cur);
        cur = null;
      }
      // Capture multi-line section titles like "ADDITIONAL REQUIREMENTS\n(CLAIMING OF WAGES):"
      let title = l.replace(/:$/, "").trim();
      const next = lines[i + 1]?.trim() ?? "";
      if (/^\([^)]+\)\s*:?\s*$/.test(next)) {
        title = `${title} ${next.replace(/:$/, "")}`.trim();
        i += 1;
      }
      items.push({ requirement: title, whereToSecure: "", isSection: true });
      continue;
    }

    let isNewItem = BULLET_RE.test(l);
    if (isNewItem) sawBullet = true;

    // Bullet-less checklist pages: infer item boundaries.
    if (!isNewItem && !sawBullet && l && cur) {
      const prevReq = cur.requirement;
      const prevEndsOpen =
        /[\/,(&-]$/.test(prevReq) ||
        /\b(and|or|of|for|the|with|from|to|by|in|on|at|per|na|ng|sa)$/i.test(prevReq) ||
        (prevReq.split("(").length > prevReq.split(")").length);
      const startsLikeItem = /^[A-Z0-9“"']/.test(l);
      const groupLabel = /:$/.test(l);

      if (!prevEndsOpen && startsLikeItem && (r || groupLabel || /[):]$/.test(prevReq))) {
        isNewItem = true;
      }
    }

    if (isNewItem) {
      if (cur) items.push(cur);
      cur = {
        requirement: l.replace(BULLET_RE, ""),
        whereToSecure: r.replace(BULLET_RE, ""),
      };
    } else if (l && cur) {
      cur.requirement += ` ${l}`;
    } else if (l && !cur) {
      cur = { requirement: l, whereToSecure: r };
      continue;
    }
    if (r && cur && !isNewItem) cur.whereToSecure = cur.whereToSecure ? `${cur.whereToSecure} ${r}` : r;
  }
  if (cur) items.push(cur);
  return { items, end: i };
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

function dice(a: string, b: string): number {
  if (!a.length || !b.length) return 0;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return (2 * inter) / (A.size + B.size);
}

// Associate each checklist block with the nearest preceding service title.
// Titles in the body often differ slightly from the TOC names, so score by
// character-bigram similarity instead of exact prefix.
function findService(blockStart: number): FlatService | null {
  for (let i = blockStart - 1; i > Math.max(0, blockStart - 200); i--) {
    const m = lines[i].match(/^\s{0,10}(\d{1,2})[.)]?\s+([A-Z].*)$/);
    if (!m) continue;
    const candidate = norm(
      m[2] + " " + (lines[i + 1]?.trim() ?? "") + " " + (lines[i + 2]?.trim() ?? "")
    );
    let best: FlatService | null = null;
    let bestScore = 0;
    for (const s of flat) {
      const target = norm(s.name);
      const score = dice(candidate.slice(0, target.length + 12), target);
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    if (best && bestScore >= 0.55) return best;
  }
  return null;
}

const byPage = new Map<number, Item[]>();
const stepsByPage = new Map<number, StepRow[]>();
const metaByPage = new Map<number, ServiceMeta>();
let matched = 0;
for (const h of headerIdx) {
  const svc = findService(h);
  const { items, end } = parseBlock(h);
  const cleaned = items
    .map((it) => ({
      requirement: it.requirement.replace(/[⮚➢●•‣▪○]\s*/g, "").replace(/\s+/g, " ").trim(),
      whereToSecure: it.whereToSecure.replace(/[⮚➢●•‣▪○]\s*/g, "").replace(/\s+/g, " ").trim(),
      isSection: Boolean(it.isSection),
    }))
    .filter((it) => it.requirement.length > 1)
    // Drop leftover column-header fragments
    .filter((it) => !/^(PERSON|PROCESSIN|FEE CLIENT|CLIENT S TO)$/i.test(it.requirement))
    .filter((it) => !/^(PERSON|PROCESSIN)$/i.test(it.whereToSecure));
  if (!svc || !cleaned.length) continue;
  matched++;
  const existing = byPage.get(svc.page);
  if (existing) existing.push(...cleaned);
  else byPage.set(svc.page, cleaned);

  if (!metaByPage.has(svc.page)) {
    const meta = parseMeta(h);
    if (
      meta.description ||
      meta.officeOrDivision ||
      meta.classification ||
      meta.typeOfTransaction ||
      meta.whoMayAvail
    ) {
      metaByPage.set(svc.page, meta);
    }
  }

  // Parse the client-steps table that follows this checklist
  const { rows } = parseSteps(end);
  const cleanRows = rows
    .map((r) => ({
      step: r.step.replace(/\s+/g, " ").trim(),
      action: r.action.replace(/\s+/g, " ").trim(),
      fee: r.fee.replace(/\s+/g, " ").trim(),
      time: r.time.replace(/\s+/g, " ").trim(),
      person: r.person.replace(/\s+/g, " ").trim(),
    }))
    .filter((r) => (r.step.length > 1 || r.action.length > 1) && !/^ACTIONS?$/i.test(r.action))
    .filter((r) => !(/^(AGENCY|CLIENT)/i.test(r.action) && !r.step))
    // Drop TOTAL residue that spilled into the last step before the end marker
    .map((r) => {
      let { fee, time } = r;
      if (/^See$/i.test(fee) || /^See Price$/i.test(fee) || /^List$/i.test(fee)) {
        fee = "See Price List";
      }
      if (/See\s+\d+\s+minutes/i.test(fee)) fee = "See Price List";
      if (/^None\s+(\d+\s+minutes?)/i.test(time)) {
        time = RegExp.$1;
      }
      if (/^\d+\s+minutes?$/i.test(fee) && !time) {
        time = fee;
        fee = "";
      }
      return { ...r, fee, time };
    })
    .filter((r) => !/^price list$/i.test(r.fee) && !/^TOTAL/i.test(r.step));
  if (cleanRows.length) {
    const existingSteps = stepsByPage.get(svc.page);
    if (existingSteps) existingSteps.push(...cleanRows);
    else stepsByPage.set(svc.page, cleanRows);
  }
}

console.log(
  `blocks=${headerIdx.length} matched=${matched} services-with-data=${byPage.size}/${flat.length} services-with-steps=${stepsByPage.size}/${flat.length} services-with-meta=${metaByPage.size}/${flat.length}`
);

const medicineRows = parseMedicineList();
const dispensingPage =
  flat.find((s) => /Dispensing of Medicine/i.test(s.name))?.page ?? 59;
console.log(`medicines=${medicineRows.length} (page ${dispensingPage})`);

const entries = [...byPage.entries()].sort((a, b) => a[0] - b[0]);
let out = `/** Auto-extracted from the 2026 Citizens' Charter PDF (1st Edition).
 * Keyed by charter page number of each service.
 */

export interface CharterRequirement {
  requirement: string;
  whereToSecure: string;
  isSection?: boolean;
}

export interface CharterStep {
  step: string;
  action: string;
  fee: string;
  time: string;
  person: string;
}

export interface CharterServiceMeta {
  description: string;
  officeOrDivision: string;
  classification: string;
  typeOfTransaction: string;
  whoMayAvail: string;
}

export interface CharterMedicine {
  name: string;
  preparation: string;
  brand: string;
  price: string;
  isSection?: boolean;
}

export const CITIZENS_CHARTER_REQUIREMENTS: Record<number, CharterRequirement[]> = {
`;
for (const [page, items] of entries) {
  out += `  ${page}: [\n`;
  for (const it of items) {
    if (it.isSection) {
      out += `    { requirement: ${JSON.stringify(it.requirement)}, whereToSecure: "", isSection: true },\n`;
    } else {
      out += `    { requirement: ${JSON.stringify(it.requirement)}, whereToSecure: ${JSON.stringify(it.whereToSecure)} },\n`;
    }
  }
  out += `  ],\n`;
}
out += `};\n\nexport const CITIZENS_CHARTER_STEPS: Record<number, CharterStep[]> = {\n`;
const stepEntries = [...stepsByPage.entries()].sort((a, b) => a[0] - b[0]);
for (const [page, rows] of stepEntries) {
  out += `  ${page}: [\n`;
  for (const r of rows) {
    out += `    { step: ${JSON.stringify(r.step)}, action: ${JSON.stringify(r.action)}, fee: ${JSON.stringify(r.fee)}, time: ${JSON.stringify(r.time)}, person: ${JSON.stringify(r.person)} },\n`;
  }
  out += `  ],\n`;
}
out += `};\n\nexport const CITIZENS_CHARTER_META: Record<number, CharterServiceMeta> = {\n`;
const metaEntries = [...metaByPage.entries()].sort((a, b) => a[0] - b[0]);
for (const [page, meta] of metaEntries) {
  out += `  ${page}: {\n`;
  out += `    description: ${JSON.stringify(meta.description)},\n`;
  out += `    officeOrDivision: ${JSON.stringify(meta.officeOrDivision)},\n`;
  out += `    classification: ${JSON.stringify(meta.classification)},\n`;
  out += `    typeOfTransaction: ${JSON.stringify(meta.typeOfTransaction)},\n`;
  out += `    whoMayAvail: ${JSON.stringify(meta.whoMayAvail)},\n`;
  out += `  },\n`;
}
out += `};\n\nexport const CITIZENS_CHARTER_MEDICINES: Record<number, CharterMedicine[]> = {\n`;
if (medicineRows.length) {
  out += `  ${dispensingPage}: [\n`;
  for (const r of medicineRows) {
    if (r.isSection) {
      out += `    { name: ${JSON.stringify(r.name)}, preparation: "", brand: "", price: "", isSection: true },\n`;
    } else {
      out += `    { name: ${JSON.stringify(r.name)}, preparation: ${JSON.stringify(r.preparation)}, brand: ${JSON.stringify(r.brand)}, price: ${JSON.stringify(r.price)} },\n`;
    }
  }
  out += `  ],\n`;
}
out += `};\n`;

writeFileSync("features/citizens-charter/requirements-2026.ts", out);
console.log("wrote features/citizens-charter/requirements-2026.ts");
