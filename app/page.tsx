"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Character, CharacterCategory, Gender, TYPE_OPTIONS, characterById, characters } from "./characters";
import {
  BillingPeriod, ModelId, PlanId, RelationshipTone, ResponseStyleId, ShopCategory,
  hasPlan, models, planById, plans, responseStyles, shopCategories, shopItems,
} from "./product-data";

type Section = "feed" | "pairs" | "shop" | "tasks" | "plans" | "profile";
type CategoryFilter = "all" | CharacterCategory;
type Message = { id: string; role: "user" | "assistant"; content: string; createdAt: number };
type ChatRecord = { characterId: string; messages: Message[]; updatedAt: number };
type ChatMap = Record<string, ChatRecord>;
type PairConfig = { scenario: number; tone: RelationshipTone; model: ModelId; style: ResponseStyleId };
type PairMap = Record<string, PairConfig>;
type Usage = { date: string; messages: number; photos: number; voices: number; videos: number };
type AppState = {
  coins: number; plan: PlanId; planUntil: number; pairs: string[]; configs: PairMap; owned: string[];
  dailyClaim: string; claimed: string[]; settings: { initiative: boolean; photos: boolean; rpg: boolean; noHints: boolean };
  usage: Usage;
};
type InvoiceProduct = "messages_30" | "unlimited_day" | "premium_month" | "plan_basic" | "plan_premium" | "plan_vip" | "plan_elite" | "plan_ultimate" | "plan_basic_year" | "plan_premium_year" | "plan_vip_year" | "plan_elite_year" | "plan_ultimate_year" | "coins_100" | "coins_500" | "coins_1200";
type TelegramUser = { id?: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };
type TelegramWebApp = {
  ready?: () => void; expand?: () => void; initDataUnsafe?: { user?: TelegramUser };
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
  onEvent?: (event: "safeAreaChanged" | "contentSafeAreaChanged", callback: () => void) => void;
  offEvent?: (event: "safeAreaChanged" | "contentSafeAreaChanged", callback: () => void) => void;
  openInvoice?: (url: string, callback: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
  HapticFeedback?: { impactOccurred?: (style: "light" | "medium") => void; notificationOccurred?: (type: "success" | "error") => void };
};

declare global { interface Window { Telegram?: { WebApp?: TelegramWebApp } } }

const STORE_KEY = "tvoyaaibot:product:v4";
const CHAT_KEY = "tvoyaaibot:chats:v3";
const FAVORITE_KEY = "tvoyaaibot:favorites:v2";
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const defaultConfig = (): PairConfig => ({ scenario: 0, tone: "romance", model: "qwen", style: "standard" });
const initialState = (): AppState => ({
  coins: 0, plan: "free", planUntil: 0, pairs: [], configs: {}, owned: [], dailyClaim: "", claimed: [],
  settings: { initiative: true, photos: true, rpg: false, noHints: false },
  usage: { date: today(), messages: 0, photos: 0, voices: 0, videos: 0 },
});
const fmt = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : `${value}`;
const scenarioOptions = (character: Character) => [
  { title: character.scenario, icon: "✦" },
  { title: `Случайная встреча с ${character.name}`, icon: "☀" },
  { title: `Поздний разговор наедине`, icon: "☾" },
];

export default function Home() {
  const [section, setSection] = useState<Section>("feed");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<"popular" | "new">("popular");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedGenders, setSelectedGenders] = useState<Set<Gender>>(new Set(["female", "male", "other"]));
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatMap>({});
  const [app, setApp] = useState<AppState>(initialState);
  const [draftConfig, setDraftConfig] = useState<PairConfig>(defaultConfig);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [shopFilter, setShopFilter] = useState<Set<ShopCategory>>(new Set(shopCategories.map((item) => item.id)));
  const [billing, setBilling] = useState<BillingPeriod>("month");
  const [paying, setPaying] = useState<InvoiceProduct | null>(null);
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<TelegramUser>({ first_name: "Гость" });
  const listRef = useRef<HTMLDivElement>(null);

  const active = activeId ? characterById[activeId] : undefined;
  const detail = detailId ? characterById[detailId] : undefined;
  const activeChat = activeId ? chats[activeId] : undefined;
  const effectivePlan: PlanId = app.planUntil > Date.now() ? app.plan : "free";
  const plan = planById[effectivePlan];
  const remaining = plan.messageLimit > 1000 ? Infinity : Math.max(0, plan.messageLimit - app.usage.messages);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    const applySafeArea = () => {
      const css = getComputedStyle(document.documentElement);
      const top = Math.max(webApp?.safeAreaInset?.top || 0, webApp?.contentSafeAreaInset?.top || 0,
        Number.parseFloat(css.getPropertyValue("--tg-safe-area-inset-top")) || 0,
        Number.parseFloat(css.getPropertyValue("--tg-content-safe-area-inset-top")) || 0);
      const bottom = Math.max(webApp?.safeAreaInset?.bottom || 0, webApp?.contentSafeAreaInset?.bottom || 0,
        Number.parseFloat(css.getPropertyValue("--tg-safe-area-inset-bottom")) || 0,
        Number.parseFloat(css.getPropertyValue("--tg-content-safe-area-inset-bottom")) || 0);
      document.documentElement.style.setProperty("--app-safe-top", `${top}px`);
      document.documentElement.style.setProperty("--app-safe-bottom", `${bottom}px`);
    };
    webApp?.ready?.(); webApp?.expand?.(); applySafeArea();
    if (webApp?.initDataUnsafe?.user) setUser(webApp.initDataUnsafe.user);
    webApp?.onEvent?.("safeAreaChanged", applySafeArea); webApp?.onEvent?.("contentSafeAreaChanged", applySafeArea);
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) || "null") as AppState | null;
      const storedChats = JSON.parse(localStorage.getItem(CHAT_KEY) || "{}") as ChatMap;
      const storedFavorites = JSON.parse(localStorage.getItem(FAVORITE_KEY) || "[]") as string[];
      if (stored) setApp({ ...initialState(), ...stored, usage: stored.usage?.date === today() ? stored.usage : { date: today(), messages: 0, photos: 0, voices: 0, videos: 0 } });
      setChats(storedChats); setFavorites(new Set(storedFavorites));
    } catch { /* Device-local data can safely reset. */ }
    setHydrated(true);
    return () => { webApp?.offEvent?.("safeAreaChanged", applySafeArea); webApp?.offEvent?.("contentSafeAreaChanged", applySafeArea); };
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(STORE_KEY, JSON.stringify(app)); }, [app, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(CHAT_KEY, JSON.stringify(chats)); }, [chats, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(FAVORITE_KEY, JSON.stringify([...favorites])); }, [favorites, hydrated]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [activeChat?.messages.length, typing]);
  useEffect(() => { document.body.style.overflow = detailId || activeId || filterOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [detailId, activeId, filterOpen]);

  const filtered = useMemo(() => characters.filter((character) => {
    const text = `${character.name} ${character.subtitle} ${character.types.join(" ")} ${character.traits.join(" ")}`.toLowerCase();
    return (category === "all" || character.category === category) && selectedGenders.has(character.gender)
      && (!selectedTypes.size || [...selectedTypes].some((type) => character.types.includes(type)))
      && (!query.trim() || text.includes(query.trim().toLowerCase()));
  }).sort((a, b) => sort === "popular" ? b.chats - a.chats : b.created - a.created), [category, query, selectedGenders, selectedTypes, sort]);

  const chatList = useMemo(() => Object.values(chats).filter((chat) => chat.messages.length).sort((a, b) => b.updatedAt - a.updatedAt), [chats]);
  const openDetail = (character: Character) => { setDetailId(character.id); setDraftConfig(app.configs[character.id] || defaultConfig()); };
  const go = (next: Section) => { setSection(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const toast = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(""), 3500); };
  const toggleFavorite = (id: string) => setFavorites((value) => { const next = new Set(value); next.has(id) ? next.delete(id) : next.add(id); return next; });

  function addPair(character: Character) {
    setApp((current) => ({ ...current, pairs: current.pairs.includes(character.id) ? current.pairs : [...current.pairs, character.id], configs: { ...current.configs, [character.id]: draftConfig } }));
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    toast(`${character.name} добавлена в пары`);
  }

  function enterChat(character: Character) {
    addPair(character);
    setChats((current) => current[character.id] ? current : { ...current, [character.id]: { characterId: character.id, updatedAt: Date.now(), messages: [{ id: uid(), role: "assistant", content: character.opening, createdAt: Date.now() }] } });
    setDetailId(null); setActiveId(character.id);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!active || !message.trim() || typing) return;
    if (remaining <= 0) { go("plans"); setActiveId(null); return; }
    const mine: Message = { id: uid(), role: "user", content: message.trim(), createdAt: Date.now() };
    const messages = [...(activeChat?.messages || []), mine];
    setChats((current) => ({ ...current, [active.id]: { characterId: active.id, messages, updatedAt: Date.now() } }));
    setApp((current) => ({ ...current, usage: { ...current.usage, messages: current.usage.messages + 1 } }));
    setMessage(""); setTyping(true);
    const wait = new Promise((resolve) => window.setTimeout(resolve, 1400 + Math.random() * 1200));
    let reply = "Мне интересно, как ты это видишь. Давай не будем спешить и продолжим отсюда.";
    try {
      const config = app.configs[active.id] || defaultConfig();
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        characterId: active.id, modelId: config.model, tone: config.tone, style: config.style,
        scenario: scenarioOptions(active)[config.scenario]?.title,
        messages: messages.map(({ role, content }) => ({ role, content })),
      }) });
      const data = await response.json() as { reply?: string };
      if (response.ok && data.reply) reply = data.reply;
    } catch { /* Keep chat responsive if provider is briefly unavailable. */ }
    await wait;
    const answer: Message = { id: uid(), role: "assistant", content: reply, createdAt: Date.now() };
    setChats((current) => ({ ...current, [active.id]: { characterId: active.id, updatedAt: Date.now(), messages: [...(current[active.id]?.messages || messages), answer] } }));
    setTyping(false);
  }

  function claimDaily() {
    if (app.dailyClaim === today()) return toast("Бонус сегодня уже получен");
    setApp((current) => ({ ...current, coins: current.coins + 5, dailyClaim: today() }));
    toast("Получено 5 монет");
  }

  function claimTask(id: string, reward: number, ready: boolean) {
    if (!ready || app.claimed.includes(id)) return;
    setApp((current) => ({ ...current, coins: current.coins + reward, claimed: [...current.claimed, id] }));
    toast(`Получено ${reward} монет`);
  }

  function buyShopItem(id: string, price: number, required: PlanId) {
    if (!hasPlan(effectivePlan, required)) { go("plans"); return toast(`Нужен тариф ${planById[required].name}`); }
    if (app.owned.includes(id)) return toast("Уже в коллекции");
    if (app.coins < price) return toast("Не хватает монет — пополни баланс в профиле");
    setApp((current) => ({ ...current, coins: current.coins - price, owned: [...current.owned, id] }));
    toast("Добавлено в коллекцию");
  }

  async function pay(productId: InvoiceProduct, activation?: { plan?: PlanId; coins?: number; days?: number }) {
    setPaying(productId);
    try {
      const response = await fetch("/api/invoice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
      const data = await response.json() as { invoiceUrl?: string; error?: string };
      if (!response.ok || !data.invoiceUrl) throw new Error(data.error || "Счёт недоступен");
      const webApp = window.Telegram?.WebApp;
      if (!webApp?.openInvoice) { window.open(data.invoiceUrl, "_blank", "noopener,noreferrer"); toast("Счёт открыт в Telegram"); setPaying(null); return; }
      webApp.openInvoice(data.invoiceUrl, (status) => {
        if (status === "paid") {
          setApp((current) => ({ ...current, coins: current.coins + (activation?.coins || 0), plan: activation?.plan || current.plan, planUntil: activation?.plan ? Date.now() + (activation.days || 30) * 86400000 : current.planUntil }));
          toast("Оплата прошла — доступ активирован"); webApp.HapticFeedback?.notificationOccurred?.("success");
        } else if (status === "failed") toast("Telegram не смог завершить оплату");
        setPaying(null);
      });
    } catch (error) { toast(error instanceof Error ? error.message : "Не удалось создать счёт"); setPaying(null); }
  }

  const nav: { id: Section; icon: string; label: string }[] = [
    { id: "feed", icon: "◉", label: "Лента" }, { id: "pairs", icon: "♡", label: "Пары" }, { id: "shop", icon: "▣", label: "Магазин" },
    { id: "tasks", icon: "▤", label: "Задания" }, { id: "plans", icon: "♕", label: "Тарифы" }, { id: "profile", icon: "♙", label: "Профиль" },
  ];

  return <main className="product-app">
    <header className="topbar"><div className="topbrand"><img src="/brand-avatar.png" alt=""/><span>TvoyaAIbot</span><small>18+</small></div><button onClick={() => go("plans")}>{plan.icon} {plan.name}</button></header>
    <ResourceDock coins={app.coins} messages={remaining} photos={Math.max(0, plan.photoLimit - app.usage.photos)} voices={Math.max(0, plan.voiceLimit - app.usage.voices)} videos={Math.max(0, plan.videoLimit - app.usage.videos)} onCoins={() => go("profile")} />
    {notice && <button className="toast" onClick={() => setNotice("")}>{notice}<span>×</span></button>}

    {section === "feed" && <FeedScreen filtered={filtered} category={category} sort={sort} query={query} searchOpen={searchOpen} filterCount={selectedTypes.size} favorites={favorites}
      setCategory={setCategory} setSort={setSort} setQuery={setQuery} setSearchOpen={setSearchOpen} openFilters={() => setFilterOpen(true)} openDetail={openDetail} toggleFavorite={toggleFavorite} goPlans={() => go("plans")} />}
    {section === "pairs" && <PairsScreen pairIds={app.pairs} chats={chatList} configs={app.configs} onOpen={openDetail} onChat={(id) => setActiveId(id)} onCatalog={() => go("feed")} />}
    {section === "shop" && <ShopScreen filters={shopFilter} owned={app.owned} currentPlan={effectivePlan} coins={app.coins} onFilter={(id) => setShopFilter((value) => { const next = new Set(value); next.has(id) ? next.delete(id) : next.add(id); return next; })} onBuy={buyShopItem} onCoins={() => go("profile")} />}
    {section === "tasks" && <TasksScreen app={app} chatCount={app.usage.messages} favorites={favorites.size} onDaily={claimDaily} onClaim={claimTask} />}
    {section === "plans" && <PlansScreen billing={billing} currentPlan={effectivePlan} paying={paying} setBilling={setBilling} onBuy={(id) => pay(`plan_${id}${billing === "year" ? "_year" : ""}` as InvoiceProduct, { plan: id, days: billing === "year" ? 365 : 30 })} />}
    {section === "profile" && <ProfileScreen user={user} app={app} plan={plan} onToggle={(key) => setApp((current) => ({ ...current, settings: { ...current.settings, [key]: !current.settings[key] } }))} onCoins={(amount) => pay(amount === 100 ? "coins_100" : amount === 500 ? "coins_500" : "coins_1200", { coins: amount })} onNotice={toast} />}

    <nav className="main-nav">{nav.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => go(item.id)}><i>{item.icon}</i><span>{item.label}</span></button>)}</nav>
    {detail && <CharacterSheet character={detail} currentPlan={effectivePlan} config={draftConfig} paired={app.pairs.includes(detail.id)} favorite={favorites.has(detail.id)} onConfig={setDraftConfig} onFavorite={() => toggleFavorite(detail.id)} onClose={() => setDetailId(null)} onPair={() => addPair(detail)} onChat={() => enterChat(detail)} onPlans={() => { setDetailId(null); go("plans"); }} />}
    {active && <ChatView character={active} chat={activeChat} typing={typing} message={message} remaining={remaining} onMessage={setMessage} onSubmit={submit} onClose={() => setActiveId(null)} onProfile={() => openDetail(active)} onPlans={() => { setActiveId(null); go("plans"); }} listRef={listRef} />}
    {filterOpen && <FilterSheet types={selectedTypes} genders={selectedGenders} result={filtered.length} onType={(type) => setSelectedTypes((value) => { const next = new Set(value); next.has(type) ? next.delete(type) : next.add(type); return next; })} onGender={(gender) => setSelectedGenders((value) => { const next = new Set(value); next.has(gender) ? next.delete(gender) : next.add(gender); return next; })} onReset={() => { setSelectedTypes(new Set()); setSelectedGenders(new Set(["female", "male", "other"])); }} onClose={() => setFilterOpen(false)} />}
  </main>;
}

function ResourceDock({ coins, messages, photos, voices, videos, onCoins }: { coins: number; messages: number; photos: number; voices: number; videos: number; onCoins: () => void }) {
  return <div className="resource-dock"><button onClick={onCoins}><i>●</i><b>{coins}</b><em>＋</em></button><span><i>◯</i><b>{messages === Infinity ? "∞" : messages}</b></span><span><i>▧</i><b>{photos}</b></span><span><i>♩</i><b>{voices}</b></span><span><i>▣</i><b>{videos}</b></span></div>;
}

function FeedScreen({ filtered, category, sort, query, searchOpen, filterCount, favorites, setCategory, setSort, setQuery, setSearchOpen, openFilters, openDetail, toggleFavorite, goPlans }: {
  filtered: Character[]; category: CategoryFilter; sort: "popular" | "new"; query: string; searchOpen: boolean; filterCount: number; favorites: Set<string>;
  setCategory: (value: CategoryFilter) => void; setSort: (value: "popular" | "new") => void; setQuery: (value: string) => void; setSearchOpen: (value: boolean) => void;
  openFilters: () => void; openDetail: (value: Character) => void; toggleFavorite: (id: string) => void; goPlans: () => void;
}) {
  const tabs: { id: CategoryFilter; label: string }[] = [{ id: "all", label: "Все" }, { id: "anime", label: "Аниме" }, { id: "realistic", label: "Реалистик" }, { id: "roleplay", label: "Ролевые" }];
  return <section className="screen feed-screen"><button className="hero-offer" onClick={goPlans}><img src="/brand-avatar.png" alt=""/><div><span>♕ ТОЛЬКО 24 ЧАСА</span><h2>Premium со скидкой</h2><p>Безлимитный диалог, память отношений и все персонажи</p><b>Открыть предложение →</b></div></button><div className="title-row"><i>◉</i><h1>Найдите свою пару</h1><span>{filtered.length}</span></div><div className="segmented">{tabs.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div><div className="catalog-actions"><div className="segmented compact"><button className={sort === "popular" ? "active" : ""} onClick={() => setSort("popular")}>Популярные</button><button className={sort === "new" ? "active" : ""} onClick={() => setSort("new")}>Новые</button></div><button onClick={openFilters}>☷ Фильтры{filterCount ? ` · ${filterCount}` : ""}</button><button aria-label="Поиск" onClick={() => setSearchOpen(!searchOpen)}>⌕</button></div>{searchOpen && <div className="search"><span>⌕</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя, характер или типаж"/><button onClick={() => { setQuery(""); setSearchOpen(false); }}>×</button></div>}<div className="character-grid">{filtered.map((character) => <CharacterCard key={character.id} character={character} favorite={favorites.has(character.id)} onFavorite={() => toggleFavorite(character.id)} onOpen={() => openDetail(character)} />)}</div></section>;
}

function CharacterCard({ character, favorite, onFavorite, onOpen }: { character: Character; favorite: boolean; onFavorite: () => void; onOpen: () => void }) {
  return <article className="character-card"><button className="card-open" onClick={onOpen}><Image src={character.image} alt={`${character.name}, ${character.age}`} fill sizes="250px"/><div className="photo-shade"/><span className={`type-mark ${character.category}`}>{character.category === "anime" ? "ANIME" : character.category === "realistic" ? "REAL" : "ROLEPLAY"}</span><div className="card-copy"><h2>{character.name}, {character.age}</h2><p>{character.subtitle}</p><small>♡ {fmt(character.likes)} · ◌ {fmt(character.chats)}</small><div>{character.traits.slice(0, 3).map((item) => <em key={item}>{item}</em>)}</div></div></button><button className={favorite ? "heart active" : "heart"} onClick={onFavorite}>{favorite ? "♥" : "♡"}</button></article>;
}

function PairsScreen({ pairIds, chats, configs, onOpen, onChat, onCatalog }: { pairIds: string[]; chats: ChatRecord[]; configs: PairMap; onOpen: (c: Character) => void; onChat: (id: string) => void; onCatalog: () => void }) {
  return <section className="screen"><div className="title-row"><i>♡</i><h1>Мои пары</h1><button onClick={onCatalog}>＋ Каталог</button></div>{pairIds.length ? <div className="pair-list">{pairIds.map((id) => { const c = characterById[id]; const chat = chats.find((item) => item.characterId === id); if (!c) return null; return <article key={id}><button className="pair-main" onClick={() => onChat(id)}><img src={c.image} alt=""/><span><b>{c.name}, {c.age}</b><small>{chat?.messages.at(-1)?.content || c.opening}</small><em>{models.find((model) => model.id === (configs[id]?.model || "qwen"))?.name}</em></span><i>›</i></button><button className="pair-settings" onClick={() => onOpen(c)}>Настроить</button></article>; })}</div> : <Empty icon="♡" title="Пока нет пар" text="Выбери персонажа, сценарий и стиль общения" action={onCatalog} button="Найти компаньона" />}</section>;
}

function ShopScreen({ filters, owned, currentPlan, coins, onFilter, onBuy, onCoins }: { filters: Set<ShopCategory>; owned: string[]; currentPlan: PlanId; coins: number; onFilter: (id: ShopCategory) => void; onBuy: (id: string, price: number, required: PlanId) => void; onCoins: () => void }) {
  return <section className="screen"><div className="title-row"><i>▣</i><h1>Магазин</h1><button className="coin-pill" onClick={onCoins}>● {coins} ＋</button></div><div className="shop-filters"><b>Категории</b><div>{shopCategories.map((cat) => <button key={cat.id} className={filters.has(cat.id) ? "active" : ""} onClick={() => onFilter(cat.id)}><span>{filters.has(cat.id) ? "✓" : ""}</span>{cat.icon} {cat.label}</button>)}</div></div><div className="shop-grid">{shopItems.filter((item) => filters.has(item.category)).map((item) => { const locked = !hasPlan(currentPlan, item.required); const isOwned = owned.includes(item.id); return <article key={item.id} style={{ "--item-accent": item.accent } as React.CSSProperties}><div className="shop-badges"><span>{shopCategories.find((cat) => cat.id === item.category)?.label}</span>{item.required !== "free" && <b>{planById[item.required].name}</b>}</div><div className="shop-art">{item.art}</div><h2>{item.title}</h2><p>{item.description}</p><button className={locked ? "locked" : ""} onClick={() => onBuy(item.id, item.price, item.required)}>{isOwned ? "✓ В коллекции" : locked ? `🔒 От ${planById[item.required].name}` : `${item.price} ●`}</button>{item.preview && <small>◉ Примерка доступна</small>}</article>; })}</div></section>;
}

function TasksScreen({ app, chatCount, favorites, onDaily, onClaim }: { app: AppState; chatCount: number; favorites: number; onDaily: () => void; onClaim: (id: string, reward: number, ready: boolean) => void }) {
  const tasks = [{ id: "messages", icon: "◯", title: "Дойди до 10 сообщений", text: "Общайся и получи бонус", reward: 50, progress: Math.min(chatCount, 10), goal: 10 }, { id: "favorite", icon: "♡", title: "Добавь 3 избранных", text: "Собери свою подборку", reward: 30, progress: Math.min(favorites, 3), goal: 3 }, { id: "pair", icon: "✦", title: "Создай первую пару", text: "Выбери сценарий и стиль", reward: 25, progress: Math.min(app.pairs.length, 1), goal: 1 }];
  return <section className="screen"><div className="title-row"><i>▤</i><h1>Задания</h1></div><div className="reward-summary"><span>Заработано в заданиях<b>● {app.coins}</b></span><span>Ещё доступно<b>＋105</b></span></div><article className="daily"><h2>🎁 Ежедневный бонус</h2><div>{[5, 10, 15, 20, 25, 30, 35].map((value, index) => <span className={index === 0 ? "active" : ""} key={value}><b>{value}</b><small>День {index + 1}</small></span>)}</div><button onClick={onDaily} disabled={app.dailyClaim === today()}>{app.dailyClaim === today() ? "✓ Получено сегодня" : "Получить +5"}</button></article><div className="task-cards">{tasks.map((task) => { const done = task.progress >= task.goal; const claimed = app.claimed.includes(task.id); return <article key={task.id}><i>{task.icon}</i><div><h2>{task.title}</h2><p>{task.text}</p><b>● +{task.reward}</b><small>Прогресс: {task.progress}/{task.goal}</small><progress value={task.progress} max={task.goal}/></div><button disabled={!done || claimed} onClick={() => onClaim(task.id, task.reward, done)}>{claimed ? "✓" : done ? "Забрать" : "…"}</button></article>; })}</div></section>;
}

function PlansScreen({ billing, currentPlan, paying, setBilling, onBuy }: { billing: BillingPeriod; currentPlan: PlanId; paying: InvoiceProduct | null; setBilling: (value: BillingPeriod) => void; onBuy: (id: PlanId) => void }) {
  return <section className="screen"><div className="title-row"><i>♕</i><h1>Тарифы</h1></div><div className="billing"><button className={billing === "month" ? "active" : ""} onClick={() => setBilling("month")}>Месяц</button><button className={billing === "year" ? "active" : ""} onClick={() => setBilling("year")}>Год <b>−16%</b></button></div><p className="plan-note">Free: 15 сообщений в сутки · базовая модель · 2 пары</p><div className="plan-list">{plans.filter((item) => item.id !== "free").map((item) => <article key={item.id} style={{ "--plan-color": item.color } as React.CSSProperties}>{item.badge && <em>{item.badge}</em>}<header><i>{item.icon}</i><span><h2>{item.name}</h2><small>Доступ на {billing === "month" ? "30 дней" : "365 дней"}</small></span></header><strong>{billing === "month" ? item.monthlyStars : item.yearlyStars} ★ <small>/ {billing === "month" ? "мес" : "год"}</small></strong><ul>{item.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul><button disabled={currentPlan === item.id || Boolean(paying)} onClick={() => onBuy(item.id)}>{currentPlan === item.id ? "Текущий тариф" : paying === `plan_${item.id}` ? "Открываю счёт…" : `Получить ${item.name}`}</button></article>)}</div></section>;
}

function ProfileScreen({ user, app, plan, onToggle, onCoins, onNotice }: { user: TelegramUser; app: AppState; plan: (typeof planById)[PlanId]; onToggle: (key: keyof AppState["settings"]) => void; onCoins: (amount: number) => void; onNotice: (text: string) => void }) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Гость";
  const toggles: { key: keyof AppState["settings"]; title: string; text: string }[] = [{ key: "initiative", title: "Инициатива персонажа", text: "Персонаж сможет начать следующий разговор" }, { key: "photos", title: "Фото персонажа", text: "Иногда присылает подходящие фото в чат" }, { key: "rpg", title: "Варианты хода в RPG", text: "2–4 кнопки с вариантами продолжения" }, { key: "noHints", title: "Без подсказок в конце", text: "Не завершает ответ списком вариантов" }];
  return <section className="screen"><div className="title-row"><i>♙</i><h1>Профиль</h1></div><article className="profile-card"><div className="profile-cover"/><div className="user-line">{user.photo_url ? <img src={user.photo_url} alt=""/> : <span>{name.slice(0, 1)}</span>}<div><h2>{name}</h2><p>@{user.username || "telegram_user"}</p></div><b>{plan.name}</b></div><div className="balance"><span>● <b>{app.coins}</b> монет</span><button onClick={() => onCoins(100)}>＋ Пополнить</button></div></article><div className="setting-list">{toggles.map((item) => <article key={item.key}><div><h2>{item.title}</h2><p>{item.text}</p></div><button className={app.settings[item.key] ? "toggle active" : "toggle"} onClick={() => onToggle(item.key)}><span/></button></article>)}</div><article className="referral"><h2>♧ Пригласи друга</h2><p>50 монет после первых 10 сообщений друга</p><button onClick={() => { navigator.clipboard?.writeText("https://t.me/TvoyaAIbot?start=ref"); onNotice("Ссылка скопирована"); }}>▣ Копировать ссылку</button></article><button className="wide-link" onClick={() => onNotice("Напиши администратору бота в Telegram")}>♢ Связаться с поддержкой <span>›</span></button><button className="wide-link promo-link" onClick={() => onNotice("Поле промокода появится после подключения БД")}>🎁 Промокоды <span>›</span></button><article className="usage"><h2>Сегодня</h2><div><span>◯ сообщ.<b>{app.usage.messages}/{plan.messageLimit > 1000 ? "∞" : plan.messageLimit}</b></span><span>▧ фото<b>{app.usage.photos}/{plan.photoLimit}</b></span><span>♩ голос<b>{app.usage.voices}/{plan.voiceLimit}</b></span><span>▣ видео<b>{app.usage.videos}/{plan.videoLimit}</b></span></div></article><div className="coin-packs"><h2>Пополнить монеты</h2><button onClick={() => onCoins(100)}>100 ● · 49 ★</button><button onClick={() => onCoins(500)}>500 ● · 199 ★</button><button onClick={() => onCoins(1200)}>1200 ● · 399 ★</button></div></section>;
}

function CharacterSheet({ character, currentPlan, config, paired, favorite, onConfig, onFavorite, onClose, onPair, onChat, onPlans }: { character: Character; currentPlan: PlanId; config: PairConfig; paired: boolean; favorite: boolean; onConfig: (value: PairConfig) => void; onFavorite: () => void; onClose: () => void; onPair: () => void; onChat: () => void; onPlans: () => void }) {
  const scenarios = scenarioOptions(character);
  return <div className="overlay"><button className="overlay-dismiss" onClick={onClose}/><section className="character-sheet"><div className="sheet-hero"><img src={character.image} alt=""/><div/><button onClick={onClose}>×</button><button className={favorite ? "favorite" : ""} onClick={onFavorite}>{favorite ? "♥" : "♡"}</button><span><h1>{character.name}, {character.age}</h1><p>{character.subtitle}</p></span></div><div className="sheet-body"><h3>ИСТОРИЯ</h3><p className="story">{character.description} {character.scenario}</p><h3>ЧЕРТЫ ХАРАКТЕРА</h3><div className="chips">{character.types.map((type) => <span key={type}>{type}</span>)}</div><h3>▣ НАЧАЛО ИСТОРИИ</h3><p className="hint">Выбери, как начнётся ваша история</p><div className="scenario-list">{scenarios.map((item, index) => <button key={item.title} className={config.scenario === index ? "active" : ""} onClick={() => onConfig({ ...config, scenario: index })}><img src={character.image} alt=""/><span>{item.title}<small>{item.icon}</small></span>{config.scenario === index && <b>✓</b>}</button>)}</div><h3>✦ ТЕМП ОТНОШЕНИЙ</h3><div className="tone-grid"><button className={config.tone === "romance" ? "active" : ""} onClick={() => onConfig({ ...config, tone: "romance" })}><i>☘</i><b>Романтика</b><span>Уверенное развитие без спешки</span></button><button className={config.tone === "mature" ? "active" : ""} onClick={() => hasPlan(currentPlan, "premium") ? onConfig({ ...config, tone: "mature" }) : onPlans()}><i>◉</i><b>Откровенный <em>18+</em></b><span>{hasPlan(currentPlan, "premium") ? "Взрослый режим с границами" : "Доступно от Premium 🔒"}</span></button></div><h3>МОДЕЛЬ ЧАТА</h3><div className="model-list">{models.map((model) => { const locked = !hasPlan(currentPlan, model.required); return <button key={model.id} className={config.model === model.id ? "active" : ""} onClick={() => locked ? onPlans() : onConfig({ ...config, model: model.id })}><i>{model.icon}</i><span><b>{model.name}</b><small>{model.note}</small></span>{locked ? <em>🔒 {planById[model.required].name}</em> : config.model === model.id ? <strong>✓</strong> : null}</button>; })}</div><h3>СТИЛЬ ОТВЕТА</h3><div className="style-grid">{responseStyles.map((style) => { const locked = !hasPlan(currentPlan, style.required); return <button key={style.id} className={config.style === style.id ? "active" : ""} onClick={() => locked ? onPlans() : onConfig({ ...config, style: style.id })}><i>{style.icon}</i>{style.name}{locked && <small>🔒</small>}</button>; })}</div><div className="sheet-actions"><button onClick={onPair}>{paired ? "✓ Сохранить настройки" : "♡ Добавить в пары"}</button><button onClick={onChat}>◯ Начать диалог</button></div></div></section></div>;
}

function ChatView({ character, chat, typing, message, remaining, onMessage, onSubmit, onClose, onProfile, onPlans, listRef }: { character: Character; chat?: ChatRecord; typing: boolean; message: string; remaining: number; onMessage: (value: string) => void; onSubmit: (event: FormEvent) => void; onClose: () => void; onProfile: () => void; onPlans: () => void; listRef: React.RefObject<HTMLDivElement | null> }) {
  return <section className="chat-view"><header><button onClick={onClose}>‹</button><button className="chat-person" onClick={onProfile}><img src={character.image} alt=""/><span><b>{character.name}, {character.age}</b><small>{typing ? "печатает…" : "в сети"}</small></span></button><button className="chat-limit" onClick={onPlans}>✦ {remaining === Infinity ? "∞" : remaining}</button></header><div className="message-list" ref={listRef}>{chat?.messages.map((item) => <div key={item.id} className={`message ${item.role === "user" ? "mine" : "theirs"}`}>{item.content}</div>)}{typing && <div className="message theirs typing"><i/><i/><i/></div>}{remaining !== Infinity && remaining <= 5 && remaining > 0 && <p className="limit-note">Осталось {remaining} сообщений</p>}{remaining === 0 && <button className="limit-card" onClick={onPlans}>Лимит на сегодня закончился<small>Открыть тарифы →</small></button>}</div><form onSubmit={onSubmit}><button type="button">＋</button><input value={message} disabled={typing} onChange={(event) => onMessage(event.target.value)} placeholder={typing ? `${character.name} печатает…` : "Сообщение"}/><button type="submit" disabled={!message.trim() || typing}>↑</button></form></section>;
}

function FilterSheet({ types, genders, result, onType, onGender, onReset, onClose }: { types: Set<string>; genders: Set<Gender>; result: number; onType: (type: string) => void; onGender: (gender: Gender) => void; onReset: () => void; onClose: () => void }) {
  const genderData: { id: Gender; label: string }[] = [{ id: "female", label: "Женский" }, { id: "male", label: "Мужской" }, { id: "other", label: "Другое" }];
  return <div className="overlay sheet-overlay"><button className="overlay-dismiss" onClick={onClose}/><section className="filter-sheet"><header><div><h2>Фильтры</h2><p>Подберите персонажа под свой вкус</p></div><button onClick={onClose}>×</button></header><div className="filter-body"><h3>Пол</h3><div className="filter-chips">{genderData.map((item) => <button className={genders.has(item.id) ? "active" : ""} key={item.id} onClick={() => onGender(item.id)}><span>{genders.has(item.id) ? "✓" : ""}</span>{item.label}</button>)}</div><h3>Типаж</h3><div className="filter-chips">{TYPE_OPTIONS.map((type) => <button className={types.has(type) ? "active" : ""} key={type} onClick={() => onType(type)}><span>{types.has(type) ? "✓" : ""}</span>{type}</button>)}</div></div><footer><button onClick={onReset}>Сбросить</button><button onClick={onClose}>Показать · {result}</button></footer></section></div>;
}

function Empty({ icon, title, text, action, button }: { icon: string; title: string; text: string; action: () => void; button: string }) {
  return <div className="empty"><i>{icon}</i><h2>{title}</h2><p>{text}</p><button onClick={action}>{button}</button></div>;
}
