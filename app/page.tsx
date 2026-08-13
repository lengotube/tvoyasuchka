"use client";

import { FormEvent, useMemo, useState } from "react";

type Character = {
  id: string;
  name: string;
  age: number;
  role: string;
  bio: string;
  accent: string;
  initial: string;
};

const characters: Character[] = [
  { id: "alice", name: "Алиса", age: 21, role: "Нежная мечтательница", bio: "Кино, ночь и разговоры по душам", accent: "lilac", initial: "А" },
  { id: "mia", name: "Мия", age: 22, role: "Дерзкая творческая", bio: "Музыка, скетчи и планы на сегодня", accent: "peach", initial: "М" },
  { id: "sasha", name: "Саша", age: 23, role: "Спокойная опора", bio: "Умеет слушать и замечать важное", accent: "mint", initial: "С" },
  { id: "nora", name: "Нора", age: 24, role: "Умная авантюристка", bio: "Путешествия, игры и маленький риск", accent: "sky", initial: "Н" },
];

const offers = [
  { id: "messages", icon: "💬", title: "+30 сообщений", caption: "Чтобы не прерывать диалог", stars: 49 },
  { id: "day", icon: "✨", title: "Безлимит на сутки", caption: "Без лимита в течение 24 часов", stars: 99 },
  { id: "premium", icon: "💎", title: "Premium", caption: "Безлимит, память и все персонажи", stars: 199, popular: true },
];

const replies = [
  "Мне нравится, что ты говоришь так честно. Расскажешь чуть больше?",
  "Это звучит как история, которую хочется дослушать до конца ✨",
  "Я запомню. Такие детали делают наши разговоры по-настоящему твоими.",
];

export default function Home() {
  const [chosen, setChosen] = useState<Character | null>(null);
  const [adult, setAdult] = useState(false);
  const [tab, setTab] = useState<"chat" | "gallery" | "profile">("chat");
  const [storeOpen, setStoreOpen] = useState(false);
  const [text, setText] = useState("");
  const [remaining, setRemaining] = useState(15);
  const [messages, setMessages] = useState<{ from: "me" | "her"; text: string }[]>([]);
  const [premium, setPremium] = useState(false);
  const current = chosen ?? characters[0];
  const relationship = useMemo(() => Math.min(10, 1 + Math.floor(messages.length / 5)), [messages.length]);

  function begin(character: Character) {
    setChosen(character);
    setMessages([{ from: "her", text: `Привет, я ${character.name}. Рада познакомиться — как проходит твой вечер?` }]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    if (!premium && remaining === 0) {
      setStoreOpen(true);
      return;
    }
    setMessages((items) => [...items, { from: "me", text: value }, { from: "her", text: replies[items.length % replies.length] }]);
    setText("");
    if (!premium) setRemaining((value) => Math.max(0, value - 1));
  }

  if (!chosen) {
    return (
      <main className="onboarding">
        <div className="orb orb-one" /><div className="orb orb-two" />
        <section className="onboarding-card">
          <div className="brand"><img src="/brand-avatar.png" alt="TvoyaAIbot" /><span>♥</span> TvoyaAIbot</div>
          <p className="eyebrow">ТВОЙ AI-КОМПАНЬОН</p>
          <h1>Выбери ту,<br />с кем будет <em>тепло.</em></h1>
          <p className="lead">15 бесплатных сообщений в день. Сохраняем важные детали, а не просто историю чата.</p>
          <div className="girl-grid">
            {characters.map((character) => (
              <button className={`girl-card ${character.accent}`} key={character.id} onClick={() => begin(character)}>
                <span className="portrait">{character.initial}</span>
                <span><strong>{character.name}, {character.age}</strong><small>{character.role}</small></span>
                <b>→</b>
              </button>
            ))}
          </div>
          <p className="disclaimer">Продолжая, ты подтверждаешь, что тебе исполнилось 18 лет.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="avatar-button" onClick={() => setTab("profile")} aria-label="Открыть профиль"><img src="/brand-avatar.png" alt="" /></button>
        <div><p>{current.name} <span className="online">● online</span></p><small>Уровень отношений {relationship} · доверие растёт</small></div>
        <button className="stars" onClick={() => setStoreOpen(true)} aria-label="Открыть магазин">✦ <b>{premium ? "Premium" : `${remaining}/15`}</b></button>
      </header>

      {tab === "chat" && <section className="chat-view">
        <div className="relationship"><span>❤</span><div><b>Ваша связь</b><small>уровень {relationship} из 10</small></div><div className="progress"><i style={{ width: `${relationship * 10}%` }} /></div></div>
        <div className="day-label">СЕГОДНЯ</div>
        <div className="messages">
          {messages.map((message, index) => <div className={`bubble ${message.from}`} key={index}>{message.text}</div>)}
          {!premium && remaining <= 6 && remaining > 0 && <div className="soft-note">Сегодня осталось {remaining} сообщений. Можно продолжить завтра или выбрать пакет без ограничений.</div>}
          {!premium && remaining === 0 && <button className="limit-card" onClick={() => setStoreOpen(true)}><span>Лимит на сегодня закончился</span><small>Открыть варианты продолжения →</small></button>}
        </div>
        <form className="composer" onSubmit={submit}>
          <button type="button" className="plus" onClick={() => setTab("gallery")}>＋</button>
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder={`Написать ${current.name}...`} />
          <button type="submit" className="send">↑</button>
        </form>
      </section>}

      {tab === "gallery" && <section className="feature-view">
        <p className="eyebrow">ГАЛЕРЕЯ</p><h2>Моменты с {current.name}</h2>
        <div className={`photo-card ${current.accent}`}><span className="portrait huge">{current.initial}</span><div><b>Личный кадр</b><small>Генерация фото появится после подключения фото-провайдера.</small></div></div>
        <button className="primary" onClick={() => setStoreOpen(true)}>Открыть возможности</button>
      </section>}

      {tab === "profile" && <section className="feature-view profile-view">
        <span className="profile-photo"><img src="/brand-avatar.png" alt="Аватар TvoyaAIbot" /></span><h2>{current.name}, {current.age}</h2><p>{current.bio}</p>
        <div className="adult-row"><div><b>🔞 Режим 18+</b><small>Только для совершеннолетних</small></div><button className={adult ? "toggle active" : "toggle"} onClick={() => setAdult(!adult)} aria-label="Переключить режим 18+"><i /></button></div>
        <button className="secondary" onClick={() => setChosen(null)}>Сменить собеседницу</button>
      </section>}

      <nav className="bottom-nav">
        <button className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>◌<span>Чат</span></button>
        <button className={tab === "gallery" ? "active" : ""} onClick={() => setTab("gallery")}>▧<span>Фото</span></button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>♡<span>Профиль</span></button>
      </nav>

      {storeOpen && <div className="sheet-backdrop" onClick={() => setStoreOpen(false)}>
        <section className="store-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="handle" /><p className="eyebrow">ПРОДОЛЖИТЬ ОБЩЕНИЕ</p><h2>Выбери свой ритм</h2>
          <p className="muted">Никаких скрытых списаний. Оплата через Telegram Stars.</p>
          {offers.map((offer) => <button className={`offer ${offer.popular ? "popular" : ""}`} key={offer.id} onClick={() => { if (offer.id === "premium") setPremium(true); if (offer.id === "messages") setRemaining((n) => n + 30); if (offer.id === "day") setPremium(true); setStoreOpen(false); }}>
            <span className="offer-icon">{offer.icon}</span><span><b>{offer.title}</b><small>{offer.caption}</small></span><strong>{offer.stars} <i>★</i></strong>{offer.popular && <em>ВЫГОДНО</em>}
          </button>)}
          <button className="close-sheet" onClick={() => setStoreOpen(false)}>Не сейчас</button>
        </section>
      </div>}
    </main>
  );
}
