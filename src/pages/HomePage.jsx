import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import "./home.css";

const PROBLEMS = [
  {
    title: "Поддельные дипломы",
    text: "На рынке встречаются сфальсифицированные документы об образовании — без единого источника правды проверка затруднена.",
  },
  {
    title: "Разрозненные данные",
    text: "Работодателям и госорганам сложно быстро подтвердить выпуск: реестры не связаны, нет стандартизированной выдачи подтверждения.",
  },
  {
    title: "Риски для репутации",
    text: "Ошибочный или отсутствующий контроль ведёт к найму без нужной квалификации и репутационным потерям.",
  },
];

const ROLES = [
  {
    id: "vuz",
    title: "ВУЗ",
    desc: "Загрузка реестров выпускников, подписание данных электронной подписью, актуализация сведений.",
    to: "/login/vuz",
    cta: "Вход для ВУЗа",
    accent: "purple",
  },
  {
    id: "student",
    title: "Студент / выпускник",
    desc: "Просмотр записи о дипломе, выпуск одноразовой ссылки или QR-кода для проверки работодателем.",
    to: "/login",
    cta: "Вход для студента",
    accent: "cyan",
  },
  {
    id: "hr",
    title: "HR / работодатель",
    desc: "Поиск по реестру, сканирование QR и получение статуса подлинности с учётом срока действия и отзыва.",
    to: "/login",
    cta: "Портал для HR",
    accent: "magenta",
  },
];

const CAPABILITIES = [
  {
    title: "QR и срок действия (TTL)",
    text: "Выдача проверяемых токенов с ограниченным временем жизни, возможность инвалидации и отзыва.",
  },
  {
    title: "Единый реестр",
    text: "Агрегированные сведения от аккредитованных организаций с контролем целостности и подписи.",
  },
  {
    title: "Масштаб и отказоустойчивость",
    text: "Событийная архитектура, оркестрация контейнеров и ограничение нагрузки для стабильной работы под пиками запросов.",
  },
];

export default function HomePage() {
  const nav = (
    <nav className="top-bar__nav" aria-label="Основная навигация">
      <a href="#about" className="top-bar__nav-link">
        О платформе
      </a>
      <a href="#problem" className="top-bar__nav-link">
        Задача
      </a>
      <a href="#roles" className="top-bar__nav-link">
        Участники
      </a>
      <Link to="/login/vuz" className="top-bar__nav-link top-bar__nav-link--muted">
        ВУЗам
      </Link>
      <Link to="/login" className="top-bar__nav-cta">
        Войти
      </Link>
    </nav>
  );

  return (
    <AuthShell nav={nav} mainClassName="main main--landing">
      <div className="home">
        <section className="home-hero" aria-labelledby="home-hero-title">
          <div className="home-hero__content">
            <p className="home-eyebrow">Платформа DIASOFT</p>
            <h1 id="home-hero-title" className="home-hero__title">
              Проверка дипломов в&nbsp;едином доверенном реестре
            </h1>
            <p className="home-hero__lead">
              Защита от подделок для вузов, выпускников и работодателей: электронные реестры, подпись данных, QR-проверка с
              контролем срока действия и отзыва.
            </p>
            <div className="home-hero__actions">
              <Link to="/login/vuz" className="btn btn--primary home-hero__btn">
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">Кабинет ВУЗа</span>
              </Link>
              <Link to="/login" className="btn btn--secondary home-hero__btn">
                <span className="btn__label">Студент или HR</span>
              </Link>
            </div>
          </div>
          <div className="home-hero__panel" aria-hidden="true">
            <div className="home-hero__qr">
              <span className="home-hero__qr-label">Проверка по QR</span>
              <div className="home-hero__qr-grid" />
              <span className="home-hero__qr-meta">TTL · отзыв · аудит</span>
            </div>
          </div>
        </section>

        <section id="about" className="home-section" aria-labelledby="about-title">
          <h2 id="about-title" className="home-section__title">
            Что делает платформа
          </h2>
          <p className="home-section__intro">
            Решение закрывает пробел между выпуском диплома и быстрой доверенной верификацией: данные приходят из первоисточника
            (вуза), фиксируются в реестре и доступны для проверки в цифровом виде.
          </p>
          <ul className="home-pillars">
            {CAPABILITIES.map((item) => (
              <li key={item.title} className="home-pillar">
                <h3 className="home-pillar__title">{item.title}</h3>
                <p className="home-pillar__text">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="problem" className="home-section home-section--tight" aria-labelledby="problem-title">
          <h2 id="problem-title" className="home-section__title">
            Проблематика
          </h2>
          <p className="home-section__intro">
            Кейс из практики: рост числа сомнительных документов и отсутствие единой точки проверки для рынка труда и государства.
          </p>
          <ul className="home-problems">
            {PROBLEMS.map((p) => (
              <li key={p.title} className="home-problem">
                <span className="home-problem__dot" aria-hidden="true" />
                <div>
                  <h3 className="home-problem__title">{p.title}</h3>
                  <p className="home-problem__text">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="roles" className="home-section" aria-labelledby="roles-title">
          <h2 id="roles-title" className="home-section__title">
            Участники и личные кабинеты
          </h2>
          <p className="home-section__intro">
            Три роли из технического задания: отдельные сценарии входа и полномочий — вуз загружает и подписывает данные, студент
            выдаёт подтверждение, работодатель проверяет реестр и QR.
          </p>
          <ul className="home-roles">
            {ROLES.map((role) => (
              <li key={role.id} className={`home-role home-role--${role.accent}`}>
                <h3 className="home-role__title">{role.title}</h3>
                <p className="home-role__desc">{role.desc}</p>
                <Link to={role.to} className="home-role__link">
                  {role.cta}
                  <span aria-hidden="true"> →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <footer className="home-footer">
          <p className="home-footer__text">
            <strong>DIASOFT</strong> — IT-решения для финансового сектора и цифровизации. Платформа построена с учётом требований к
            безопасности, производительности и сопровождению.
          </p>
          <p className="home-footer__legal">Демонстрационный интерфейс кейса · 2026</p>
        </footer>
      </div>
    </AuthShell>
  );
}
