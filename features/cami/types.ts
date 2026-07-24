import type { Language } from "@/lib/i18n/translations";

export type CamiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CamiCitation = {
  title: string;
  href: string;
  type: string;
};

export type CamiChatRequest = {
  message: string;
  language?: Language;
  history?: CamiMessage[];
};

export type CamiChatResponse = {
  reply: string;
  citations: CamiCitation[];
  source: "llm" | "local" | "offline";
  usedWeb: boolean;
};

export type CamiKnowledgeChunk = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  score?: number;
};
