"use client";

import { FormEvent, useState } from "react";

type Section = "feed" | "chats" | "pairs" | "tasks" | "subscription";

type Character = {
  id: string;
  name: string;
  age: number;
  subtitle: string;
  description: string;
  tags: string[];
  gradient: string;
  image: string;
  likes: string;
  chats: string;
};

const characters: Character[] = [
  { id: "alice", name: "Алиса", age: 24, subtitle: "Нежная мечтательница", description: "Любит ночные прогулки, честные слова и фильмы, которые не заканчиваются на титрах.", tags: ["добрая", "романтичная", "внимательная"], gradient: "alice", image: "/alice.png", likes: "1.4K", chats: "12.8K" },
  { id: "mia", name: "Мия", age: 25, subtitle: "Дерзкая творческая", description: "Музыка в наушниках, скетчи в заметках и тысячи идей для вашего вечера.", tags: ["ироничная", "смелая", "творческая"], gradient: "mia", image: "/mia.png", likes: "980", chats: "9.1K" },
  { id: "sasha", name: "Саша", age: 26, subtitle: "Спокойная опора", description: "Умеет слушать внимательно и поддерживать без лишних громких слов.", tags: ["мягкая", "заботливая", "честная"], gradient: "sasha", image: "/sasha.png", likes: "2.1K", chats: "18.4K" },
  { id: "nora", name: "Нора", age: 27, subtitle: "Умная авантюристка", description: "Превращает обычный вечер в маленькое приключение — с вопроса «а что, если?»", tags: ["умная", "игривая", "свободная"], gradient: "nora", image: "/nora.png", likes: "1.2K", chats: "7.9K" },
];

const chatReplies = ["Мне нравится, что ты говоришь так честно. Расскажешь ещё?", "Я сохраню это в нашей памяти. Такие детали важны.", "С тобой хочется не торопиться и просто разговаривать ✨"];

function Icon({ children }: { children: string }) { return <span className="icon" aria-hidden="true">{children}</span>; }

export default function Home() {
  const [section, setSection] = useState<Section>("feed");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("Все");
  const [selected, setSelected] = useState<Character | null>(null);
  const [active, setActive] = useState<Character | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ from: "me" | "her"; text: string }[]>([]);
  const [remaining, setRemaining] = useState(15);

  function enterChat(character: Character) {
    setActive(character);
    setSelected(null);
    setSection("chats");
    if (messages.length === 0) setMessages([{ from: "her", text: `Привет, я ${character.name}. Рада, что ты выбрал меня. Как проходит твой вечер?` }]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    if (remaining === 0) { setStoreOpen(true); return; }
    const text = message.trim();
    setMessages((old) => [...old, { from: "me", text }, { from: "her", text: chatReplies[old.length % chatReplies.length] }]);
    setMessage("");
    setRemaining((value) => Math.max(0, value - 1));
  }

  const nav: { id: Section; icon: string; label: string }[] = [
    { id: "feed", icon: "◉", label: "Лента" }, { id: "chats", icon: "▢", label: "Чаты" }, { id: "pairs", icon: "♡", label: "Пары" }, { id: "tasks", icon: "▤", label: "Задания" }, { id: "subscription", icon: "♕", label: "Premium" },
  ];

  return <main className="dark-app">
    <header className="app-header">
      <button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Открыть меню">☰</button>
      <div className="mini-brand"><img src="/brand-avatar.png" alt="TvoyaAIbot" /><span>РАННИЙ ДОСТУП</span></div>
      <button className="sale-button" onClick={() => setStoreOpen(true)}>♕ −70%</button>
      <button className="login-button">↪ Войти</button>
    </header>

    {section === "feed" && <section className="feed-screen">
      <button className="promo" onClick={() => setStoreOpen(true)}>
        <img src="/brand-avatar.png" alt="" /><div><span>♕ ТОЛЬКО 24 ЧАСА</span><b>Premium со скидкой −70%</b><small>Безлимитный диалог, память отношений и все персонажи</small><i>Открыть предложение →</i></div>
      </button>
      <div className="screen-title"><Icon>◉</Icon><h1>Найдите свою пару</h1></div>
      <div className="filters"><div>{["Все", "Аниме", "Реалистик", "Ролевые"].map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="filter-button">☷ Фильтры</button><button className="search-button">⌕ Поиск</button></div>
      <div className="catalog">
        {characters.map((character) => <article className={`character-card ${character.gradient}`} key={character.id} onClick={() => setSelected(character)}>
          <button className="heart" aria-label="Добавить в избранное" onClick={(event) => event.stopPropagation()}>♡</button>
          <img className="character-photo" src={character.image} alt={`${character.name}, ${character.age}`} />
          <div className="card-info"><h2>{character.name}, {character.age}</h2><p>{character.subtitle}</p><span>♡ {character.likes} &nbsp; ◌ {character.chats}</span><div>{character.tags.map((tag) => <em key={tag}>{tag}</em>)}</div></div>
        </article>)}
      </div>
    </section>}

    {section === "chats" && <section className="plain-screen">{active ? <>
      <div className="chat-heading"><button onClick={() => setActive(null)}>‹</button><div className={`chat-avatar ${active.gradient}`}>{active.name[0]}</div><div><b>{active.name}, {active.age}</b><small>в сети · уровень доверия 1</small></div><button onClick={() => setStoreOpen(true)}>✦ {remaining}/15</button></div>
      <div className="message-list">{messages.map((item, index) => <div className={`message ${item.from}`} key={index}>{item.text}</div>)}{remaining <= 6 && remaining > 0 && <p className="quota">Осталось {remaining} бесплатных сообщений на сегодня.</p>}{remaining === 0 && <button className="chat-paywall" onClick={() => setStoreOpen(true)}>Лимит на сегодня закончился <small>Выбрать пакет →</small></button>}</div>
      <form className="chat-compose" onSubmit={submit}><button type="button">＋</button><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Написать ${active.name}...`} /><button type="submit">↑</button></form>
    </> : <Empty title="Чаты" icon="▢" button="Начать общение" action={() => setSection("feed")} />}</section>}
    {section === "pairs" && <section className="plain-screen"><Empty title="Пары" icon="♡" button="Найти компаньона" action={() => setSection("feed")} /></section>}
    {section === "tasks" && <section className="plain-screen"><Empty title="Задания" icon="▤" button="Посмотреть персонажей" action={() => setSection("feed")} text="Скоро здесь появятся задания для развития отношений." /></section>}
    {section === "subscription" && <section className="plain-screen"><Subscription onBuy={() => setStoreOpen(true)} /></section>}

    <nav className="bottom-nav">{nav.map((item) => <button className={section === item.id ? "active" : ""} key={item.id} onClick={() => setSection(item.id)}><Icon>{item.icon}</Icon><span>{item.label}</span></button>)}</nav>

    {menuOpen && <><div className="backdrop" onClick={() => setMenuOpen(false)} /><aside className="side-menu"><button className="close-menu" onClick={() => setMenuOpen(false)}>☰</button><div className="mini-brand"><img src="/brand-avatar.png" alt="TvoyaAIbot" /><span>РАННИЙ ДОСТУП</span></div><div className="side-links">{nav.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => { setSection(item.id); setMenuOpen(false); }}><Icon>{item.icon}</Icon>{item.label}</button>)}<button><Icon>＋</Icon>Создать персонажа</button><button><Icon>◌</Icon>Поддержка</button></div></aside></>}

    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className={`character-modal ${selected.gradient}`} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><img className="modal-photo" src={selected.image} alt={`${selected.name}, ${selected.age}`} /><div className="modal-copy"><p>AI-КОМПАНЬОН</p><h2>{selected.name}, {selected.age}</h2><b>{selected.subtitle}</b><div>{selected.tags.map((tag) => <em key={tag}>{tag}</em>)}</div><span>{selected.description}</span><button onClick={() => enterChat(selected)}>Продолжить <i>›</i></button></div></section></div>}

    {storeOpen && <div className="modal-backdrop" onClick={() => setStoreOpen(false)}><section className="pay-sheet" onClick={(event) => event.stopPropagation()}><div className="drag" /><p>ПРОДОЛЖИТЬ ОБЩЕНИЕ</p><h2>Выбери свой ритм</h2><small>Оплата через Telegram Stars. Никаких скрытых списаний.</small>{[["💬", "+30 сообщений", "49"], ["✨", "Безлимит на сутки", "99"], ["♕", "Premium на 30 дней", "199"]].map(([icon, title, stars], index) => <button key={title} className={index === 2 ? "best" : ""} onClick={() => { if (index === 0) setRemaining((n) => n + 30); else setRemaining(999); setStoreOpen(false); }}><i>{icon}</i><span><b>{title}</b><small>{index === 2 ? "Память отношений, все персонажи и безлимит" : "Продолжай диалог в своём темпе"}</small></span><strong>{stars} ★</strong>{index === 2 && <em>ВЫГОДНО</em>}</button>)}<button className="not-now" onClick={() => setStoreOpen(false)}>Не сейчас</button></section></div>}
  </main>;
}

function Empty({ title, icon, button, action, text }: { title: string; icon: string; button: string; action: () => void; text?: string }) { return <><div className="section-heading"><Icon>{icon}</Icon><h1>{title}</h1>{title === "Чаты" && <button onClick={action}>＋ Новый чат</button>}</div><div className="empty"><Icon>{icon}</Icon><p>{text ?? `Пока нет ${title.toLowerCase()}`}</p><button onClick={action}>{button}</button></div><footer>© 2026 TvoyaAIbot · Telegram · Условия · Конфиденциальность · Поддержка</footer></>; }
function Subscription({ onBuy }: { onBuy: () => void }) { return <><div className="section-heading"><Icon>♕</Icon><h1>Premium</h1></div><div className="premium-panel"><span>♕</span><p>Больше близости<br />без ограничений</p><small>Безлимитный чат, расширенная память отношений, все персонажи и приоритетные функции.</small><button onClick={onBuy}>Открыть Premium · 199 ★</button></div></>; }
