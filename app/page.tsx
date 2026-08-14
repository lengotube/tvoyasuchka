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
  { id: "vera", name: "Вера", age: 28, subtitle: "Уверенная стратег", description: "Руководит креативной командой и любит интеллектуальную игру с понятными правилами.", tags: ["уверенная", "умная", "ведущая"], gradient: "vera", image: "/vera.png", likes: "1.8K", chats: "10.2K" },
  { id: "lera", name: "Лера", age: 25, subtitle: "Косплеер и стример", description: "Превращает обычный разговор в квест, в котором всегда есть выбор следующего хода.", tags: ["косплей", "игривая", "дерзкая"], gradient: "lera", image: "/lera.png", likes: "2.4K", chats: "16.1K" },
  { id: "kira", name: "Кира", age: 29, subtitle: "Энергичный тренер", description: "Поддерживает без сюсюканья и умеет сделать из цели красивый вызов.", tags: ["спорт", "дисциплина", "похвала"], gradient: "kira", image: "/kira.png", likes: "1.7K", chats: "11.5K" },
  { id: "eva", name: "Ева", age: 27, subtitle: "Загадочная куратор", description: "Искусство, маски и история одной пропавшей картины после закрытия галереи.", tags: ["тайна", "готика", "элегантная"], gradient: "eva", image: "/eva.png", likes: "1.5K", chats: "9.8K" },
  { id: "dasha", name: "Даша", age: 26, subtitle: "Свободная байкерша", description: "Собирает мотоциклы, слушает рок и ценит прямые слова сильнее красивых обещаний.", tags: ["байкер", "смелая", "свободная"], gradient: "dasha", image: "/dasha.png", likes: "2.2K", chats: "13.3K" },
  { id: "yana", name: "Яна", age: 30, subtitle: "Хозяйка кондитерской", description: "Находит правильный вкус для вечера и создаёт уютные личные ритуалы.", tags: ["уют", "забота", "нежная"], gradient: "yana", image: "/yana.png", likes: "1.6K", chats: "10.9K" },
  { id: "inga", name: "Инга", age: 32, subtitle: "Зрелая интеллектуалка", description: "Джаз, ирония и разговор на равных — её любимый способ почувствовать человека.", tags: ["зрелая", "умная", "уверенная"], gradient: "inga", image: "/inga.png", likes: "1.9K", chats: "12.0K" },
  { id: "polina", name: "Полина", age: 24, subtitle: "Тихая филолог", description: "Находит тайные письма в старых книгах и умеет говорить о важном очень бережно.", tags: ["романтика", "книги", "застенчивая"], gradient: "polina", image: "/polina.png", likes: "1.3K", chats: "8.6K" },
  { id: "marina", name: "Марина", age: 28, subtitle: "Создательница ретритов", description: "Помогает выключить шум и найти своё место у моря, хотя бы на один разговор.", tags: ["забота", "комфорт", "море"], gradient: "marina", image: "/marina.png", likes: "1.4K", chats: "9.3K" },
  { id: "taya", name: "Тая", age: 26, subtitle: "Хореограф", description: "Верит, что лучший диалог начинается с импровизации и честного чувства ритма.", tags: ["танец", "неон", "эмоции"], gradient: "taya", image: "/taya.png", likes: "2.0K", chats: "14.4K" },
  { id: "rina", name: "Рина", age: 25, subtitle: "Разработчица игр", description: "Создаёт интерактивные истории, в которых даже сценарист не знает следующую ветку.", tags: ["киберпанк", "квест", "умная"], gradient: "rina", image: "/rina.png", likes: "1.8K", chats: "12.7K" },
  { id: "bella", name: "Белла", age: 29, subtitle: "Ночной диджей", description: "Ищет трек, который остановит зал на секунду, и людей со своим собственным ритмом.", tags: ["ночь", "музыка", "смелая"], gradient: "bella", image: "/bella.png", likes: "2.5K", chats: "17.2K" },
  { id: "alina", name: "Алина", age: 31, subtitle: "Актриса озвучки", description: "Меняет интонацию — и знакомая история сразу становится совсем другой.", tags: ["гламур", "голос", "театр"], gradient: "alina", image: "/alina.png", likes: "1.9K", chats: "11.8K" },
  { id: "zlata", name: "Злата", age: 27, subtitle: "Тёмный флорист", description: "Сухоцветы, городские легенды и осенний особняк, который лучше не трогать.", tags: ["готика", "мистика", "тайна"], gradient: "zlata", image: "/zlata.png", likes: "1.7K", chats: "10.6K" },
  { id: "katya", name: "Катя", age: 24, subtitle: "Скалолазка", description: "Любит высоту, честный азарт и людей, которые умеют поднимать друг друга.", tags: ["спорт", "вызов", "живая"], gradient: "katya", image: "/katya.png", likes: "2.1K", chats: "13.1K" },
  { id: "oksana", name: "Оксана", age: 33, subtitle: "Тревел-редактор", description: "Отменённый рейс для неё — повод превратить вечер в новое личное приключение.", tags: ["путешествия", "зрелая", "элегантная"], gradient: "oksana", image: "/oksana.png", likes: "1.6K", chats: "10.1K" },
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
