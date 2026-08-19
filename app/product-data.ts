export type PlanId = "free" | "basic" | "premium" | "vip" | "elite" | "ultimate";
export type ModelId = "qwen" | "gemini" | "aion" | "grok";
export type ResponseStyleId = "standard" | "conversational" | "relaxed" | "short" | "cinematic";
export type RelationshipTone = "romance" | "mature";
export type BillingPeriod = "month" | "year";

export type Plan = {
  id: PlanId;
  name: string;
  icon: string;
  color: string;
  monthlyStars: number;
  yearlyStars: number;
  messageLimit: number;
  photoLimit: number;
  voiceLimit: number;
  videoLimit: number;
  characterLimit: number;
  memoryFacts: number;
  features: string[];
  badge?: string;
};

export const PLAN_ORDER: PlanId[] = ["free", "basic", "premium", "vip", "elite", "ultimate"];

export const plans: Plan[] = [
  {
    id: "free", name: "Free", icon: "✦", color: "#768195", monthlyStars: 0, yearlyStars: 0,
    messageLimit: 15, photoLimit: 1, voiceLimit: 0, videoLimit: 0, characterLimit: 2, memoryFacts: 3,
    features: ["15 сообщений в сутки", "Базовая модель Qwen3", "2 активные пары", "Короткая память отношений"],
  },
  {
    id: "basic", name: "Basic", icon: "♥", color: "#3783f6", monthlyStars: 99, yearlyStars: 999,
    messageLimit: 60, photoLimit: 5, voiceLimit: 3, videoLimit: 0, characterLimit: 4, memoryFacts: 8,
    features: ["60 сообщений в сутки", "5 фото и 3 голосовых", "4 активные пары", "До 8 фактов памяти"],
  },
  {
    id: "premium", name: "Premium", icon: "◇", color: "#a549f4", monthlyStars: 199, yearlyStars: 1999,
    messageLimit: 9999, photoLimit: 20, voiceLimit: 15, videoLimit: 2, characterLimit: 10, memoryFacts: 15,
    features: ["Безлимит сообщений", "20 фото, 15 голосовых, 2 видео", "Романтический и взрослый режимы", "10 пар и расширенная память"],
    badge: "ПОПУЛЯРНЫЙ",
  },
  {
    id: "vip", name: "VIP", icon: "★", color: "#ffad19", monthlyStars: 399, yearlyStars: 3999,
    messageLimit: 9999, photoLimit: 40, voiceLimit: 30, videoLimit: 4, characterLimit: 16, memoryFacts: 25,
    features: ["Gemini 3.1 Flash Lite", "Instant-режим Grok 4.1 Fast", "40 фото и 30 голосовых", "16 пар и глубокая память"],
  },
  {
    id: "elite", name: "Elite", icon: "♕", color: "#ff5f77", monthlyStars: 699, yearlyStars: 6999,
    messageLimit: 9999, photoLimit: 80, voiceLimit: 60, videoLimit: 8, characterLimit: 24, memoryFacts: 40,
    features: ["Aion 2.0 Roleplay", "Все стили ответа", "80 фото, 60 голосовых, 8 видео", "24 пары и 40 фактов памяти"],
  },
  {
    id: "ultimate", name: "Ultimate", icon: "◆", color: "#e7e7e7", monthlyStars: 999, yearlyStars: 9999,
    messageLimit: 9999, photoLimit: 150, voiceLimit: 100, videoLimit: 16, characterLimit: 999, memoryFacts: 60,
    features: ["Все модели без переключательных лимитов", "Максимальный приоритет генерации", "150 фото, 100 голосовых, 16 видео", "Безлимит пар и максимальная память"],
    badge: "МАКСИМУМ",
  },
];

export const planById = Object.fromEntries(plans.map((plan) => [plan.id, plan])) as Record<PlanId, Plan>;

export const models: { id: ModelId; name: string; note: string; icon: string; required: PlanId }[] = [
  { id: "qwen", name: "Qwen3 235B MoE", note: "Сбалансированный диалог", icon: "✦", required: "free" },
  { id: "gemini", name: "Gemini 3.1 Flash Lite", note: "Быстрый и живой ответ", icon: "✧", required: "vip" },
  { id: "grok", name: "Grok 4.1 Fast", note: "Instant-режим", icon: "⚡", required: "vip" },
  { id: "aion", name: "Aion 2.0 Roleplay", note: "Глубокая ролевая сцена", icon: "◉", required: "elite" },
];

export const responseStyles: { id: ResponseStyleId; name: string; description: string; icon: string; required: PlanId }[] = [
  { id: "standard", name: "Стандартный", description: "Естественно и сбалансированно", icon: "✦", required: "free" },
  { id: "conversational", name: "Разговорный", description: "Живой бытовой диалог", icon: "◯", required: "basic" },
  { id: "relaxed", name: "Раскованно", description: "Смелее и эмоциональнее", icon: "☺", required: "premium" },
  { id: "short", name: "Короткие реплики", description: "Быстрые ответы без полотен", icon: "⚡", required: "premium" },
  { id: "cinematic", name: "Кинематографичный", description: "Сцены, детали и атмосфера", icon: "▣", required: "elite" },
];

export type ShopCategory = "extra" | "clothes" | "fantasy" | "accessories" | "toys" | "fetish" | "appearance";
export type ShopItem = {
  id: string;
  category: ShopCategory;
  title: string;
  description: string;
  art: string;
  price: number;
  required: PlanId;
  preview?: boolean;
  accent: string;
};

export const shopCategories: { id: ShopCategory; label: string; icon: string }[] = [
  { id: "extra", label: "Экстра", icon: "⚡" },
  { id: "clothes", label: "Одежда", icon: "♙" },
  { id: "fantasy", label: "Фэнтези", icon: "✧" },
  { id: "accessories", label: "Аксессуары", icon: "◉" },
  { id: "toys", label: "Игрушки", icon: "◎" },
  { id: "fetish", label: "Фетиши", icon: "⊘" },
  { id: "appearance", label: "Облик", icon: "♧" },
];

export const shopItems: ShopItem[] = [
  { id: "photo25", category: "extra", title: "25 фото", description: "Дополнительные генерации фото", art: "▧", price: 160, required: "free", accent: "#c08cff" },
  { id: "photo100", category: "extra", title: "100 фото", description: "Большой пакет генераций", art: "▦", price: 490, required: "basic", accent: "#ffb230" },
  { id: "voice_pack", category: "extra", title: "20 голосовых", description: "Дополнительные голосовые ответы", art: "♩", price: 220, required: "basic", accent: "#4ae2b1" },
  { id: "instant", category: "extra", title: "Приоритет на 30 дней", description: "Ответы и генерации вне общей очереди", art: "⚡", price: 450, required: "vip", accent: "#ffbd24" },
  { id: "micro_bikini", category: "clothes", title: "Micro Bikini", description: "Смелый пляжный образ", art: "👙", price: 180, required: "basic", preview: true, accent: "#e9d9ff" },
  { id: "lingerie", category: "clothes", title: "Lingerie Set", description: "Кружевной комплект", art: "♢", price: 250, required: "basic", preview: true, accent: "#db72ff" },
  { id: "bunny", category: "clothes", title: "Bunny Suit", description: "Костюм для игровой сцены", art: "🐰", price: 240, required: "premium", preview: true, accent: "#fb90bd" },
  { id: "maid", category: "clothes", title: "Maid Outfit", description: "Классический образ горничной", art: "♟", price: 200, required: "basic", preview: true, accent: "#f1f1f1" },
  { id: "nurse", category: "clothes", title: "Nurse Uniform", description: "Ролевой медицинский образ", art: "✚", price: 220, required: "premium", preview: true, accent: "#ff667c" },
  { id: "elf", category: "fantasy", title: "Elven Night", description: "Лунная сцена в эльфийском лесу", art: "☾", price: 260, required: "basic", accent: "#74c6ff" },
  { id: "vampire", category: "fantasy", title: "Vampire Ball", description: "Бал в готическом дворце", art: "♦", price: 320, required: "premium", accent: "#f24879" },
  { id: "kemono", category: "accessories", title: "Kemonomimi", description: "Ушки и хвостик персонажа", art: "🐾", price: 160, required: "basic", preview: true, accent: "#ff93b9" },
  { id: "piercing", category: "accessories", title: "Navel Piercing", description: "Акцент для нового образа", art: "✦", price: 100, required: "free", preview: true, accent: "#e8edf6" },
  { id: "massage", category: "toys", title: "Massage Scene", description: "Расслабляющий взрослый сценарий", art: "♨", price: 180, required: "premium", accent: "#ffb866" },
  { id: "roleplay_box", category: "toys", title: "Roleplay Box", description: "Набор реквизита для сценариев", art: "▣", price: 280, required: "vip", accent: "#a962ff" },
  { id: "bdsm_light", category: "fetish", title: "BDSM Light", description: "Мягкая игровая динамика с границами", art: "∞", price: 300, required: "premium", accent: "#ff7c99" },
  { id: "foot_focus", category: "fetish", title: "Foot Focus", description: "Фокус на эстетике ног", art: "♧", price: 200, required: "premium", accent: "#f1c2ff" },
  { id: "yuri", category: "fetish", title: "Yuri Story", description: "Романтический сценарий девушка × девушка", art: "♀♀", price: 240, required: "premium", accent: "#ff70ca" },
  { id: "cosplay", category: "appearance", title: "Cosplay RP", description: "Новый образ и ролевая подача", art: "✺", price: 250, required: "basic", preview: true, accent: "#f79cff" },
  { id: "voice_design", category: "appearance", title: "Дизайн голоса", description: "Настройка тембра и манеры речи", art: "♬", price: 600, required: "vip", accent: "#67eac1" },
];

export const planRank = (plan: PlanId) => PLAN_ORDER.indexOf(plan);
export const hasPlan = (current: PlanId, required: PlanId) => planRank(current) >= planRank(required);
