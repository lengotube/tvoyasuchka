import { NextResponse } from "next/server";

const PRODUCTS = {
  messages_30: { title: "+30 сообщений", description: "30 дополнительных сообщений в TvoyaAIbot", amount: 49 },
  unlimited_day: { title: "Безлимит на сутки", description: "Безлимитное общение на 24 часа", amount: 99 },
  premium_month: { title: "Premium на 30 дней", description: "Безлимит, расширенная память и все персонажи", amount: 199 },
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
