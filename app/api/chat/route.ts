import { NextResponse } from "next/server";

import { characterById, systemPromptFor } from "../../characters";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI пока не подключён на сервере" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { characterId?: string; messages?: ChatMessage[] } | null;
  const character = body?.characterId ? characterById[body.characterId] : undefined;
  const messages = Array.isArray(body?.messages)
    ? body.messages
        .filter((item): item is ChatMessage =>
          Boolean(item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string"),
        )
        .slice(-20)
        .map((item) => ({ role: item.role, content: item.content.slice(0, 4000) }))
    : [];

  if (!character || !messages.length) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "TvoyaAIbot Mini App",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "qwen/qwen3-235b-a22b",
        messages: [{ role: "system", content: systemPromptFor(character) }, ...messages],
        max_tokens: 420,
        temperature: 0.9,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[]; model?: string };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty completion");
    return NextResponse.json({ reply, model: data.model });
  } catch (error) {
    console.error("Chat completion failed", error);
    return NextResponse.json({ error: "Не удалось получить ответ" }, { status: 502 });
  }
}
