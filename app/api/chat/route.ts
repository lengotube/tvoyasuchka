import { NextResponse } from "next/server";

import { characterById, systemPromptFor } from "../../characters";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MODELS = {
  qwen: process.env.OPENROUTER_MODEL_QWEN || process.env.OPENROUTER_MODEL || "qwen/qwen3-235b-a22b",
  gemini: process.env.OPENROUTER_MODEL_GEMINI || "google/gemini-3.1-flash-lite-preview",
  aion: process.env.OPENROUTER_MODEL_AION || "aion-labs/aion-2.0",
  grok: process.env.OPENROUTER_MODEL_GROK || "x-ai/grok-4.1-fast",
} as const;

const STYLE_PROMPTS = {
  standard: "Пиши естественно и сбалансированно, обычно 1–4 предложения.",
  conversational: "Пиши как в живой переписке: проще, теплее, допускай короткие эмоциональные реакции.",
  relaxed: "Пиши уверенно и раскованно, но сохраняй уважение к границам и добровольности.",
  short: "Пиши короткими репликами, обычно 1–2 предложения, без длинных описаний.",
  cinematic: "Добавляй атмосферу, жесты и детали сцены, сохраняя диалог динамичным.",
} as const;

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI пока не подключён на сервере" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    characterId?: string; messages?: ChatMessage[]; modelId?: keyof typeof MODELS;
    tone?: "romance" | "mature"; style?: keyof typeof STYLE_PROMPTS; scenario?: string;
  } | null;
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
    const modelId = body?.modelId && body.modelId in MODELS ? body.modelId : "qwen";
    const style = body?.style && body.style in STYLE_PROMPTS ? body.style : "standard";
    const selectedScenario = typeof body?.scenario === "string" ? body.scenario.slice(0, 800) : character.scenario;
    const tonePrompt = body?.tone === "mature"
      ? "Темп отношений взрослый и откровенный, но все участники совершеннолетние, согласие явно и границы всегда соблюдаются."
      : "Темп отношений романтический: развивай доверие постепенно и без спешки.";
    const prompt = `${systemPromptFor(character)}\n\nВыбранное начало истории: ${selectedScenario}\n${tonePrompt}\n${STYLE_PROMPTS[style]}`;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "TvoyaAIbot Mini App",
      },
      body: JSON.stringify({
        model: MODELS[modelId],
        messages: [{ role: "system", content: prompt }, ...messages],
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
