import { NextResponse } from "next/server";

const PRODUCTS = {
  messages_30: { title: "+30 сообщений", description: "30 дополнительных сообщений в TvoyaAIbot", amount: 49 },
  unlimited_day: { title: "Безлимит на сутки", description: "Безлимитное общение на 24 часа", amount: 99 },
  premium_month: { title: "Premium на 30 дней", description: "Безлимит, расширенная память и все персонажи", amount: 199 },
  plan_basic: { title: "Basic на 30 дней", description: "60 сообщений в сутки, фото, голосовые и 4 пары", amount: 99 },
  plan_premium: { title: "Premium на 30 дней", description: "Безлимит сообщений, взрослый режим и расширенная память", amount: 199 },
  plan_vip: { title: "VIP на 30 дней", description: "Gemini, Grok Instant, медиа и глубокая память", amount: 399 },
  plan_elite: { title: "Elite на 30 дней", description: "Aion Roleplay, все стили и высокий лимит медиа", amount: 699 },
  plan_ultimate: { title: "Ultimate на 30 дней", description: "Все модели, максимальные лимиты и приоритет", amount: 999 },
  plan_basic_year: { title: "Basic на год", description: "Тариф Basic на 365 дней", amount: 999 },
  plan_premium_year: { title: "Premium на год", description: "Тариф Premium на 365 дней", amount: 1999 },
  plan_vip_year: { title: "VIP на год", description: "Тариф VIP на 365 дней", amount: 3999 },
  plan_elite_year: { title: "Elite на год", description: "Тариф Elite на 365 дней", amount: 6999 },
  plan_ultimate_year: { title: "Ultimate на год", description: "Тариф Ultimate на 365 дней", amount: 9999 },
  coins_100: { title: "100 монет", description: "100 монет для магазина TvoyaAIbot", amount: 49 },
  coins_500: { title: "500 монет", description: "500 монет для магазина TvoyaAIbot", amount: 199 },
  coins_1200: { title: "1200 монет", description: "1200 монет для магазина TvoyaAIbot", amount: 399 },
} as const;

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Платежи пока не подключены на сервере" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { productId?: keyof typeof PRODUCTS } | null;
  const productId = body?.productId;
  const product = productId ? PRODUCTS[productId] : undefined;
  if (!product || !productId) {
    return NextResponse.json({ error: "Неизвестный тариф" }, { status: 400 });
  }

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: product.title,
        description: product.description,
        payload: `tvoyaaibot:${productId}:${crypto.randomUUID()}`,
        provider_token: "",
        currency: "XTR",
        prices: [{ label: product.title, amount: product.amount }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await telegramResponse.json()) as { ok?: boolean; result?: string; description?: string };
    if (!telegramResponse.ok || !data.ok || !data.result) throw new Error(data.description || "Telegram invoice error");
    return NextResponse.json({ invoiceUrl: data.result });
  } catch (error) {
    console.error("Invoice creation failed", error);
    return NextResponse.json({ error: "Не удалось создать счёт Stars" }, { status: 502 });
  }
}
