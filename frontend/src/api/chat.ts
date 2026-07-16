import { api, apiUrl, authHeaders, clearToken } from "./client";
import type { ChatMessage, ChatSession, Citation } from "../types";

export function createChatSession(title?: string): Promise<ChatSession> {
  return api.post<ChatSession>("/chat/sessions", title ? { title } : {});
}

export function fetchChatSessions(): Promise<ChatSession[]> {
  return api.get<ChatSession[]>("/chat/sessions");
}

export function fetchSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  return api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
}

export function deleteChatSession(sessionId: string): Promise<void> {
  return api.delete<void>(`/chat/sessions/${sessionId}`);
}

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onCitations: (citations: Citation[]) => void;
  onDone: () => void;
  onError: (message: string) => void;
  /** Called if the request itself is unauthorized (session expired). */
  onUnauthorized?: () => void;
}

/**
 * Sends a chat message and streams the Server-Sent-Events response, invoking the
 * relevant callback as each event arrives. EventSource isn't used because it can't
 * send a POST body or custom auth headers, so the SSE framing is parsed by hand from
 * the fetch ReadableStream.
 */
export async function streamChatMessage(
  sessionId: string,
  content: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(apiUrl(`/chat/sessions/${sessionId}/messages`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...authHeaders(),
      },
      body: JSON.stringify({ content }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    callbacks.onError(err instanceof Error ? err.message : "Network error");
    return;
  }

  if (res.status === 401) {
    clearToken();
    callbacks.onUnauthorized?.();
    callbacks.onError("Your session has expired. Please log in again.");
    return;
  }

  if (!res.ok || !res.body) {
    let message = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      message = errJson?.detail || message;
    } catch {
      // no JSON body available
    }
    callbacks.onError(message);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processRawEvent = (rawEvent: string) => {
    let eventName = "message";
    const dataLines: string[] = [];

    for (const rawLine of rawEvent.split("\n")) {
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
      if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trim());
      }
    }

    if (dataLines.length === 0) return;
    const dataStr = dataLines.join("\n");

    let payload: unknown;
    try {
      payload = JSON.parse(dataStr);
    } catch {
      return;
    }

    switch (eventName) {
      case "token":
        callbacks.onToken((payload as { text: string }).text ?? "");
        break;
      case "citations":
        callbacks.onCitations((payload as { citations: Citation[] }).citations ?? []);
        break;
      case "done":
        callbacks.onDone();
        break;
      case "error":
        callbacks.onError((payload as { message: string }).message ?? "Unknown error");
        break;
      default:
        break;
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIndex: number;
      while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        if (rawEvent.trim()) processRawEvent(rawEvent);
      }
    }
    if (buffer.trim()) processRawEvent(buffer);
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    callbacks.onError(err instanceof Error ? err.message : "Stream interrupted");
  }
}
