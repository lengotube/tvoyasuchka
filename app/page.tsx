"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { Character, CharacterCategory, Gender, TYPE_OPTIONS, characterById, characters } from "./characters";

type Section = "feed" | "chats" | "pairs" | "tasks" | "subscription";
type CategoryFilter = "all" | CharacterCategory;
type SortMode = "popular" | "new";
type Message = { id: string; role: "user" | "assistant"; content: string; createdAt: number };
type ChatRecord = { characterId: string; messages: Message[]; updatedAt: number };
type ChatMap = Record<string, ChatRecord>;
type ProductId = "messages_30" | "unlimited_day" | "premium_month";
type Quota = { date: string; freeRemaining: number; bonus: number; unlimitedUntil: number; premiumUntil: number };

type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  openInvoice?: (url: string, callback: (status: "paid" | "cancelled" | "failed" | "pending") => void) => void;
};

declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}

const CHAT_STORAGE = "tvoyaaibot:chats:v2";
const FAVORITES_STORAGE = "tvoyaaibot:favorites:v1";
const QUOTA_STORAGE = "tvoyaaibot:quota:v2";
const today = () => new Date().toISOString().slice(0, 10);
const initialQuota = (): Quota => ({ date: today(), freeRemaining: 15, bonus: 0, unlimitedUntil: 0, premiumUntil: 0 });
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const formatCount = (count: number) => count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 1 : 1)}K` : `${count}`;

const categoryTabs: { id: CategoryFilter; label: string }[] = [
  { id:"all", label:"Все" }, { id:"anime", label:"Аниме" }, { id:"realistic", label:"Реалистик" }, { id:"roleplay", label:"Ролевые" },
];
const genderOptions: { id: Gender; label: string }[] = [
  { id:"female", label:"Женский" }, { id:"male", label:"Мужской" }, { id:"other", label:"Другое" },
];
const products: { id: ProductId; icon: string; title: string; detail: string; stars: number; best?: boolean }[] = [
  { id:"messages_30", icon:"💬", title:"+30 сообщений", detail:"Добавятся к дневному лимиту", stars:49 },
  { id:"unlimited_day", icon:"✨", title:"Безлимит на сутки", detail:"Общение без лимита 24 часа", stars:99 },
  { id:"premium_month", icon:"♕", title:"Premium на 30 дней", detail:"Безлимит, память и все персонажи", stars:199, best:true },
];

function Icon({ children }: { children: string }) { return <span className="icon" aria-hidden="true">{children}</span>; }

export default function Home() {
  const [section, setSection] = useState<Section>("feed");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortMode>("popular");
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedGenders, setSelectedGenders] = useState<Set<Gender>>(new Set(["female", "male", "other"]));
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [chats, setChats] = useState<ChatMap>({});
  const [quota, setQuota] = useState<Quota>(initialQuota);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [paying, setPaying] = useState<ProductId | null>(null);
  const [notice, setNotice] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);

  const active = activeId ? characterById[activeId] : undefined;
  const profile = profileId ? characterById[profileId] : undefined;
  const activeChat = activeId ? chats[activeId] : undefined;
  const hasUnlimited = quota.unlimitedUntil > 0 || quota.premiumUntil > 0;
  const remaining = hasUnlimited ? Infinity : quota.freeRemaining + quota.bonus;
  const filtersCount = selectedTypes.size + (selectedGenders.size === 3 ? 0 : 1);

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const savedChats = JSON.parse(localStorage.getItem(CHAT_STORAGE) || "{}") as ChatMap;
        const savedFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE) || "[]") as string[];
        const savedQuota = JSON.parse(localStorage.getItem(QUOTA_STORAGE) || "null") as Quota | null;
        const currentTime = Date.now();
        const restored = savedQuota?.date === today() ? savedQuota : { ...initialQuota(), bonus:savedQuota?.bonus || 0, unlimitedUntil:savedQuota?.unlimitedUntil || 0, premiumUntil:savedQuota?.premiumUntil || 0 };
        setChats(savedChats);
        setFavorites(new Set(savedFavorites));
        setQuota({ ...restored, unlimitedUntil:restored.unlimitedUntil > currentTime ? restored.unlimitedUntil : 0, premiumUntil:restored.premiumUntil > currentTime ? restored.premiumUntil : 0 });
      } catch { /* Ignore corrupted device-local data and start clean. */ }
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem(CHAT_STORAGE, JSON.stringify(chats)); }, [chats, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(FAVORITES_STORAGE, JSON.stringify([...favorites])); }, [favorites, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem(QUOTA_STORAGE, JSON.stringify(quota)); }, [quota, hydrated]);
  useEffect(() => {
    const overlayOpen = menuOpen || Boolean(profileId) || storeOpen || filterOpen;
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, profileId, storeOpen, filterOpen]);
  useEffect(() => {
    messageListRef.current?.scrollTo({ top:messageListRef.current.scrollHeight, behavior:"smooth" });
  }, [activeChat?.messages.length, typing]);

  const filteredCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = characters.filter((character) => {
      const categoryMatch = category === "all" || character.category === category;
      const genderMatch = selectedGenders.has(character.gender);
      const typeMatch = selectedTypes.size === 0 || [...selectedTypes].some((type) => character.types.includes(type));
      const queryMatch = !normalizedQuery || `${character.name} ${character.subtitle} ${character.description} ${character.traits.join(" ")} ${character.types.join(" ")}`.toLowerCase().includes(normalizedQuery);
      return categoryMatch && genderMatch && typeMatch && queryMatch;
    });
    return result.sort((a, b) => sort === "popular" ? b.chats - a.chats : b.created - a.created);
  }, [category, query, selectedGenders, selectedTypes, sort]);

  const chatList = useMemo(() => Object.values(chats).filter((chat) => chat.messages.length).sort((a, b) => b.updatedAt - a.updatedAt), [chats]);

  function selectSection(next: Section) {
    setSection(next);
    setMenuOpen(false);
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function toggleFavorite(characterId: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(characterId)) next.delete(characterId); else next.add(characterId);
      return next;
    });
  }

  function enterChat(character: Character) {
    setChats((current) => current[character.id] ? current : {
      ...current,
      [character.id]: { characterId:character.id, updatedAt:Date.now(), messages:[{ id:uid(), role:"assistant", content:character.opening, createdAt:Date.now() }] },
    });
    setActiveId(character.id);
    setProfileId(null);
    setSection("chats");
  }

  function consumeMessage() {
    if (hasUnlimited) return;
    setQuota((current) => current.freeRemaining > 0
      ? { ...current, freeRemaining:current.freeRemaining - 1 }
      : { ...current, bonus:Math.max(0, current.bonus - 1) });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!active || !message.trim() || typing) return;
    if (remaining <= 0) { setStoreOpen(true); return; }
    const userMessage: Message = { id:uid(), role:"user", content:message.trim(), createdAt:Date.now() };
    const nextMessages = [...(activeChat?.messages || []), userMessage];
    setChats((current) => ({ ...current, [active.id]:{ characterId:active.id, messages:nextMessages, updatedAt:Date.now() } }));
    setMessage("");
    setTyping(true);
    consumeMessage();

    const minimumDelay = new Promise((resolve) => window.setTimeout(resolve, 1200 + Math.random() * 1100));
    let reply = `Мне нравится, как ты это сформулировал. Расскажешь чуть подробнее — что в этом для тебя самое важное?`;
    try {
      const response = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ characterId:active.id, messages:nextMessages.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await response.json() as { reply?: string };
      if (response.ok && data.reply) reply = data.reply;
    } catch { /* A delayed in-character fallback keeps the UI usable offline. */ }
    await minimumDelay;
    const assistantMessage: Message = { id:uid(), role:"assistant", content:reply, createdAt:Date.now() };
    setChats((current) => {
      const record = current[active.id];
      return { ...current, [active.id]:{ characterId:active.id, messages:[...(record?.messages || nextMessages), assistantMessage], updatedAt:Date.now() } };
    });
    setTyping(false);
  }

  function toggleType(type: string) {
    setSelectedTypes((current) => { const next = new Set(current); if (next.has(type)) next.delete(type); else next.add(type); return next; });
  }

  function toggleGender(gender: Gender) {
    setSelectedGenders((current) => { const next = new Set(current); if (next.has(gender)) next.delete(gender); else next.add(gender); return next; });
  }

  function resetFilters() {
    setSelectedTypes(new Set());
    setSelectedGenders(new Set(["female", "male", "other"]));
  }

  async function buyProduct(productId: ProductId) {
    setNotice("");
    setPaying(productId);
    try {
      const response = await fetch("/api/invoice", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ productId }) });
      const data = await response.json() as { invoiceUrl?: string; error?: string };
      if (!response.ok || !data.invoiceUrl) throw new Error(data.error || "Счёт недоступен");
      const webApp = window.Telegram?.WebApp;
      if (webApp?.openInvoice) {
        webApp.openInvoice(data.invoiceUrl, (status) => {
          if (status === "paid") {
            setQuota((current) => productId === "messages_30"
              ? { ...current, bonus:current.bonus + 30 }
              : productId === "unlimited_day"
                ? { ...current, unlimitedUntil:Date.now() + 24 * 60 * 60 * 1000 }
                : { ...current, premiumUntil:Date.now() + 30 * 24 * 60 * 60 * 1000 });
            setNotice("Оплата прошла — доступ активирован ✨");
            setStoreOpen(false);
          } else if (status === "failed") setNotice("Telegram не смог завершить оплату.");
          setPaying(null);
        });
      } else {
        window.open(data.invoiceUrl, "_blank", "noopener,noreferrer");
        setNotice("Счёт открыт в Telegram. После оплаты вернись в Mini App.");
        setPaying(null);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Не удалось создать счёт");
      setPaying(null);
    }
  }

  const nav: { id: Section; icon: string; label: string }[] = [
    { id:"feed", icon:"◉", label:"Лента" }, { id:"chats", icon:"▢", label:"Чаты" }, { id:"pairs", icon:"♡", label:"Пары" }, { id:"tasks", icon:"▤", label:"Задания" }, { id:"subscription", icon:"♕", label:"Premium" },
  ];

  return <main className="dark-app">
    <header className="app-header">
      <button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">☰</button>
      <div className="mini-brand"><img src="/brand-avatar.png" alt="" /><span>РАННИЙ ДОСТУП</span></div>
      <button className="sale-button" onClick={() => setStoreOpen(true)}>♕ −70%</button>
    </header>

    {notice && <button className="toast" onClick={() => setNotice("")} aria-label="Закрыть уведомление">{notice}<span>×</span></button>}

    {section === "feed" && <section className="feed-screen">
      <button className="promo" onClick={() => setStoreOpen(true)}>
        <img src="/brand-avatar.png" alt="" /><div><span>♕ ТОЛЬКО 24 ЧАСА</span><b>Premium со скидкой −70%</b><small>Безлимитный диалог, память отношений и все персонажи</small><i>Открыть предложение →</i></div>
      </button>
      <div className="screen-title"><Icon>◉</Icon><h1>Найдите свою пару</h1><span>{filteredCharacters.length}</span></div>
      <div className="category-row">{categoryTabs.map((item) => <button key={item.id} className={category === item.id ? "selected" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
      <div className="catalog-tools">
        <div className="sort-toggle"><button className={sort === "popular" ? "selected" : ""} onClick={() => setSort("popular")}>Популярные</button><button className={sort === "new" ? "selected" : ""} onClick={() => setSort("new")}>Новые</button></div>
        <button className={filtersCount ? "filter-button active" : "filter-button"} onClick={() => setFilterOpen(true)}>☷ Фильтры{filtersCount ? ` · ${filtersCount}` : ""}</button>
        <button className="search-button" onClick={() => setSearchOpen((value) => !value)}>⌕</button>
      </div>
      {searchOpen && <div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя, характер или типаж"/><button onClick={() => { setQuery(""); setSearchOpen(false); }}>×</button></div>}
      {filteredCharacters.length ? <div className="catalog">{filteredCharacters.map((character) => <CharacterCard key={character.id} character={character} favorite={favorites.has(character.id)} onFavorite={() => toggleFavorite(character.id)} onOpen={() => setProfileId(character.id)} />)}</div>
        : <div className="no-results"><Icon>⌕</Icon><b>Никого не нашли</b><span>Сбросьте часть фильтров или измените запрос.</span><button onClick={() => { resetFilters(); setQuery(""); setCategory("all"); }}>Сбросить фильтры</button></div>}
    </section>}

    {section === "chats" && <section className={active ? "chat-screen active" : "plain-screen"}>{active ? <>
      <div className="chat-heading">
        <button className="chat-back" onClick={() => setActiveId(null)} aria-label="Вернуться к чатам">‹</button>
        <button className="chat-person" onClick={() => setProfileId(active.id)}><img src={active.image} alt=""/><span><b>{active.name}, {active.age}</b><small>{typing ? "печатает…" : "в сети · доверие 1"}</small></span></button>
        <button className="quota-button" onClick={() => setStoreOpen(true)}>✦ {remaining === Infinity ? "∞" : remaining}</button>
      </div>
      <div className="message-list" ref={messageListRef}>{activeChat?.messages.map((item) => <div className={`message ${item.role === "user" ? "me" : "her"}`} key={item.id}>{item.content}</div>)}{typing && <div className="message her typing" aria-label={`${active.name} печатает`}><i/><i/><i/></div>}{remaining !== Infinity && remaining <= 6 && remaining > 0 && <p className="quota">Осталось {remaining} сообщений на сегодня</p>}{remaining === 0 && <button className="chat-paywall" onClick={() => setStoreOpen(true)}>Лимит на сегодня закончился <small>Выбрать пакет →</small></button>}</div>
      <form className="chat-compose" onSubmit={submit}><button type="button" aria-label="Вложения">＋</button><input disabled={typing} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={typing ? `${active.name} печатает…` : `Написать ${active.name}...`} /><button type="submit" disabled={typing || !message.trim()} aria-label="Отправить">↑</button></form>
    </> : <ChatsList chats={chatList} onOpen={(id) => setActiveId(id)} onNew={() => selectSection("feed")} />}</section>}

    {section === "pairs" && <section className="plain-screen"><div className="section-heading"><Icon>♡</Icon><h1>Избранное</h1></div>{favorites.size ? <div className="compact-list">{characters.filter((item) => favorites.has(item.id)).map((character) => <CompactCharacter key={character.id} character={character} onOpen={() => setProfileId(character.id)} />)}</div> : <Empty icon="♡" text="Пока нет избранных персонажей" button="Открыть каталог" action={() => selectSection("feed")} />}</section>}
    {section === "tasks" && <section className="plain-screen"><div className="section-heading"><Icon>▤</Icon><h1>Задания</h1></div><div className="task-list"><article><span>💬</span><div><b>Начни новый диалог</b><small>Награда: +3 сообщения</small></div><em>0/1</em></article><article><span>♡</span><div><b>Добавь пару в избранное</b><small>Награда: +2 сообщения</small></div><em>{favorites.size ? "1/1" : "0/1"}</em></article><article><span>✨</span><div><b>Вернись завтра</b><small>Награда: новый бесплатный лимит</small></div><em>Ежедневно</em></article></div></section>}
    {section === "subscription" && <section className="plain-screen"><div className="section-heading"><Icon>♕</Icon><h1>Premium</h1></div><div className="premium-panel"><span>♕</span><p>Больше близости<br/>без ограничений</p><small>Безлимитный чат, расширенная память отношений, все персонажи и приоритетные функции.</small><button onClick={() => setStoreOpen(true)}>Открыть Premium · 199 ★</button></div></section>}

    <nav className="bottom-nav" aria-label="Главная навигация">{nav.map((item) => <button className={section === item.id ? "active" : ""} key={item.id} onClick={() => selectSection(item.id)}><Icon>{item.icon}</Icon><span>{item.label}</span>{item.id === "chats" && chatList.length > 0 && <em>{chatList.length}</em>}</button>)}</nav>

    {menuOpen && <><button className="backdrop" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню"/><aside className="side-menu" aria-label="Меню"><div className="side-head"><button className="close-menu" onClick={() => setMenuOpen(false)}>×</button><div className="mini-brand"><img src="/brand-avatar.png" alt=""/><span>TvoyaAIbot</span></div></div><div className="side-links">{nav.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => selectSection(item.id)}><Icon>{item.icon}</Icon>{item.label}</button>)}<button onClick={() => { setMenuOpen(false); setFilterOpen(true); }}><Icon>☷</Icon>Подбор по типажу</button><button onClick={() => setNotice("Поддержка: напишите администратору бота в Telegram") }><Icon>◌</Icon>Поддержка</button></div></aside></>}

    {profile && <ProfileModal character={profile} favorite={favorites.has(profile.id)} onFavorite={() => toggleFavorite(profile.id)} onClose={() => setProfileId(null)} onChat={() => enterChat(profile)} />}
    {filterOpen && <FilterModal selectedTypes={selectedTypes} selectedGenders={selectedGenders} resultCount={filteredCharacters.length} onType={toggleType} onGender={toggleGender} onReset={resetFilters} onClose={() => setFilterOpen(false)} />}
    {storeOpen && <StoreModal paying={paying} notice={notice} onBuy={buyProduct} onClose={() => setStoreOpen(false)} />}
  </main>;
}

function CharacterCard({ character, favorite, onFavorite, onOpen }: { character: Character; favorite: boolean; onFavorite: () => void; onOpen: () => void }) {
  return <article className="character-card"><button className="card-open" onClick={onOpen} aria-label={`Открыть анкету ${character.name}`}><Image className="character-photo" src={character.image} alt={`${character.name}, ${character.age}`} fill sizes="320px"/><span className={`kind-badge ${character.category}`}>{character.category === "anime" ? "ANIME" : character.category === "roleplay" ? "RP" : "REAL"}</span><div className="card-info"><h2>{character.name}, {character.age}</h2><p>{character.subtitle}</p><span>♡ {formatCount(character.likes)} &nbsp; ◌ {formatCount(character.chats)}</span><div>{character.traits.slice(0, 3).map((tag) => <em key={tag}>{tag}</em>)}</div></div></button><button className={favorite ? "heart favorite" : "heart"} aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"} onClick={onFavorite}>{favorite ? "♥" : "♡"}</button></article>;
}

function CompactCharacter({ character, onOpen }: { character: Character; onOpen: () => void }) {
  return <button className="compact-character" onClick={onOpen}><img src={character.image} alt=""/><span><b>{character.name}, {character.age}</b><small>{character.subtitle}</small></span><i>›</i></button>;
}

function ChatsList({ chats, onOpen, onNew }: { chats: ChatRecord[]; onOpen: (id: string) => void; onNew: () => void }) {
  return <><div className="section-heading"><Icon>▢</Icon><h1>Чаты</h1><button onClick={onNew}>＋ Новый чат</button></div>{chats.length ? <div className="chat-list">{chats.map((chat) => { const character = characterById[chat.characterId]; const last = chat.messages.at(-1); if (!character) return null; return <button key={chat.characterId} onClick={() => onOpen(chat.characterId)}><img src={character.image} alt=""/><span><b>{character.name}</b><small>{last?.content}</small></span><time>{new Date(chat.updatedAt).toLocaleTimeString("ru", { hour:"2-digit", minute:"2-digit" })}</time></button>; })}</div> : <Empty icon="▢" text="Пока нет диалогов" button="Начать общение" action={onNew}/>}</>;
}

function Empty({ icon, text, button, action }: { icon: string; text: string; button: string; action: () => void }) {
  return <div className="empty"><Icon>{icon}</Icon><p>{text}</p><button onClick={action}>{button}</button></div>;
}

function ProfileModal({ character, favorite, onFavorite, onClose, onChat }: { character: Character; favorite: boolean; onFavorite: () => void; onClose: () => void; onChat: () => void }) {
  return <div className="modal-backdrop profile-backdrop"><button className="modal-dismiss" onClick={onClose} aria-label="Закрыть анкету"/><section className="character-modal" role="dialog" aria-modal="true" aria-label={`Анкета ${character.name}`}><div className="profile-hero"><img src={character.image} alt={`${character.name}, ${character.age}`}/><div className="profile-fade"/><button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button><button className={favorite ? "profile-heart favorite" : "profile-heart"} onClick={onFavorite}>{favorite ? "♥" : "♡"}</button><div className="profile-title"><span>{character.category === "anime" ? "ANIME-ПЕРСОНАЖ" : "AI-КОМПАНЬОН"}</span><h2>{character.name}, {character.age}</h2><b>{character.subtitle}</b></div></div><div className="profile-content"><div className="profile-tags">{character.types.map((tag) => <em key={tag}>{tag}</em>)}</div><p>{character.description}</p><div className="scenario"><span>ТЕКУЩИЙ СЦЕНАРИЙ</span>{character.scenario}</div><div className="gallery-head"><b>Галерея</b><small>1 фото доступно</small></div><div className="gallery"><img src={character.image} alt="Портрет персонажа"/><button onClick={() => onChat()}><span>🔒</span><b>Фото в диалоге</b></button><button onClick={() => onChat()}><span>✦</span><b>Сгенерировать</b></button></div><button className="continue-button" onClick={onChat}>Начать общение <i>›</i></button></div></section></div>;
}

function FilterModal({ selectedTypes, selectedGenders, resultCount, onType, onGender, onReset, onClose }: { selectedTypes: Set<string>; selectedGenders: Set<Gender>; resultCount: number; onType: (type: string) => void; onGender: (gender: Gender) => void; onReset: () => void; onClose: () => void }) {
  return <div className="modal-backdrop filter-backdrop"><button className="modal-dismiss" onClick={onClose} aria-label="Закрыть фильтры"/><section className="filter-sheet" role="dialog" aria-modal="true" aria-label="Фильтры персонажей"><header><div><b>Фильтры</b><span>Подберите персонажа под свой вкус</span></div><button onClick={onClose}>×</button></header><div className="filter-scroll"><fieldset><legend>Пол</legend><div className="choice-grid genders">{genderOptions.map((item) => <button key={item.id} className={selectedGenders.has(item.id) ? "checked" : ""} onClick={() => onGender(item.id)}><span>{selectedGenders.has(item.id) ? "✓" : ""}</span>{item.label}</button>)}</div></fieldset><fieldset><legend>Типаж</legend><div className="choice-grid">{TYPE_OPTIONS.map((type) => <button key={type} className={selectedTypes.has(type) ? "checked" : ""} onClick={() => onType(type)}><span>{selectedTypes.has(type) ? "✓" : ""}</span>{type}</button>)}</div></fieldset></div><footer><button className="reset-button" onClick={onReset}>Сбросить</button><button className="apply-button" onClick={onClose}>Показать · {resultCount}</button></footer></section></div>;
}

function StoreModal({ paying, notice, onBuy, onClose }: { paying: ProductId | null; notice: string; onBuy: (id: ProductId) => void; onClose: () => void }) {
  return <div className="modal-backdrop store-backdrop"><button className="modal-dismiss" onClick={onClose} aria-label="Закрыть тарифы"/><section className="pay-sheet" role="dialog" aria-modal="true" aria-label="Тарифы"><div className="drag"/><button className="sheet-close" onClick={onClose}>×</button><p>ПРОДОЛЖИТЬ ОБЩЕНИЕ</p><h2>Выбери свой ритм</h2><small>Оплата через Telegram Stars. Никаких скрытых списаний.</small>{products.map((product) => <button key={product.id} className={product.best ? "product best" : "product"} disabled={Boolean(paying)} onClick={() => onBuy(product.id)}><i>{product.icon}</i><span><b>{product.title}</b><small>{product.detail}</small></span><strong>{paying === product.id ? "…" : `${product.stars} ★`}</strong>{product.best && <em>ВЫГОДНО</em>}</button>)}{notice && <div className="payment-notice">{notice}</div>}<button className="not-now" onClick={onClose}>Не сейчас</button></section></div>;
}
