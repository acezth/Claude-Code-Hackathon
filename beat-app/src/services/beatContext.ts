export type BeatContextSource = "coach" | "groceries";

export interface BeatContextMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source: BeatContextSource;
  createdAt: string;
}

const BEAT_CONTEXT_KEY = "beat.shared-context";
const MAX_CONTEXT_MESSAGES = 24;

export function readBeatContext(): BeatContextMessage[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BEAT_CONTEXT_KEY) || "[]") as BeatContextMessage[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function appendBeatContext(
  messages: Array<Omit<BeatContextMessage, "id" | "createdAt">>,
): BeatContextMessage[] {
  const existing = readBeatContext();
  const next = [
    ...existing,
    ...messages.map((message) => ({
      ...message,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })),
  ].slice(-MAX_CONTEXT_MESSAGES);

  localStorage.setItem(BEAT_CONTEXT_KEY, JSON.stringify(next));
  return next;
}
