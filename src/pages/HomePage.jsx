import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import LandingQrVerifyDemo from "../components/LandingQrVerifyDemo.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { ROLE_LABELS, cabinetPathForRole } from "../auth/authPaths.js";
import "./home.css";

const BENEFITS = [
  {
    icon: "shield",
    title: "Доверие к документу",
    text: "Сведения идут из реестра вуза, а не из скана бумаги: меньше споров при найме и госзакупках.",
  },
  {
    icon: "bolt",
    title: "Секунды вместо недель",
    text: "Работодатель проверяет QR или запрос по реестру без писем в приёмную комиссию и долгих ожиданий.",
  },
  {
    icon: "lock",
    title: "Контроль доступа",
    text: "Срок действия токена, отзыв и разграничение ролей — выпускник сам решает, когда открыть данные.",
  },
  {
    icon: "layers",
    title: "Единая картина",
    text: "Один интерфейс для загрузки реестров, подписания пакетов и мониторинга обращений на проверку.",
  },
  {
    icon: "chart",
    title: "Готовность к нагрузке",
    text: "Сервис рассчитан на пики запросов в сезон найма и массовые выпуски без «падений» в пике.",
  },
  {
    icon: "fingerprint",
    title: "Прослеживаемость",
    text: "История изменений и технические метки помогают разбирать инциденты и отвечать регулятору.",
  },
];

const STEPS = [
  {
    title: "Вуз публикует реестр",
    text: "Загрузка и подписание данных о выпускниках, актуализация при необходимости.",
  },
  {
    title: "Выпускник получает доступ",
    text: "Личный кабинет: просмотр записи и выдача ссылки или QR для проверки.",
  },
  {
    title: "Проверка в один шаг",
    text: "HR или сервис сканирует код или ищет по реестру — мгновенный статус подлинности.",
  },
  {
    title: "Контроль и отзыв",
    text: "Истёк срок токена или нужен отзыв — статус обновляется, повторные проверки видят актуальное состояние.",
  },
];

const AUDIENCE = [
  {
    id: "vuz",
    title: "Вузам и колледжам",
    desc: "Ведение реестра выпускников, ЭП, выгрузки и сопровождение данных без лишней бюрократии.",
    to: "/login/vuz",
    cta: "Кабинет образовательной организации",
    accent: "purple",
  },
  {
    id: "graduate",
    title: "Студентам и выпускникам",
    desc: "Понятный статус диплома и безопасная передача подтверждения работодателю — вы сами управляете доступом.",
    to: "/login",
    cta: "Войти как выпускник",
    accent: "cyan",
  },
  {
    id: "hr",
    title: "HR и работодателям",
    desc: "Поиск по реестру, проверка QR и фиксация результата — меньше риска ошибочного найма.",
    to: "/login",
    cta: "Портал для HR",
    accent: "magenta",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const cabinetPath = user ? cabinetPathForRole(user.role) : "/login";
  const smoothScrollTo = (event) => {
    const href = event.currentTarget.getAttribute("href");
    if (!href || !href.startsWith("#")) {
      return;
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    event.preventDefault();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", href);
  };

  const nav = (
    <nav className="top-bar__nav" aria-label="Основная навигация">
      <a href="#benefits" className="top-bar__nav-link" onClick={smoothScrollTo}>
        Преимущества
      </a>
      <a href="#how" className="top-bar__nav-link" onClick={smoothScrollTo}>
        Как работает
      </a>
      <a href="#audience" className="top-bar__nav-link" onClick={smoothScrollTo}>
        Для кого
      </a>
      {user ? (
        <Link to={cabinetPath} className="top-bar__nav-cta top-bar__nav-cta--cabinet">
          Личный кабинет
        </Link>
      ) : (
        <Link to="/login" className="top-bar__nav-cta">
          Войти
        </Link>
      )}
    </nav>
  );

  return (
    <AuthShell nav={nav} mainClassName="main main--landing">
      <div className="landing">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <div className="landing-hero__grid">
            <div className="landing-hero__copy">
              <p className="landing-hero__badge">Единый реестр дипломов</p>
              <h1 id="landing-hero-title" className="landing-hero__title">
                Проверяйте образование быстро — без сомнений и лишних писем
              </h1>
              <p className="landing-hero__lead">
                Платформа с раздельной авторизацией для ВУЗов, студентов и HR: ведение реестра дипломов, проверка по
                номеру и QR, выпуск ссылок для подтверждения и понятный статус документа в процессе найма.
              </p>
              <div className={`landing-hero__actions${user ? " landing-hero__actions--with-session" : ""}`}>
                {user ? (
                  <>
                    <Link to={cabinetPath} className="landing-cabinet-callout">
                      <span className="landing-cabinet-callout__aurora" aria-hidden="true" />
                      <span className="landing-cabinet-callout__body">
                        <span className="landing-cabinet-callout__eyebrow">С возвращением</span>
                        <span className="landing-cabinet-callout__role">{ROLE_LABELS[user.role] ?? user.role}</span>
                        {user.lastName || user.firstName ? (
                          <span className="landing-cabinet-callout__name">
                            {[user.lastName, user.firstName].filter(Boolean).join(" ")}
                          </span>
                        ) : null}
                        <span className="landing-cabinet-callout__login">{user.login}</span>
                        <span className="landing-cabinet-callout__cta">
                          Открыть личный кабинет
                          <span className="landing-cabinet-callout__cta-arrow" aria-hidden="true">
                            →
                          </span>
                        </span>
                      </span>
                    </Link>
                    <p className="landing-hero__session-hint">Ниже — преимущества и сценарии платформы</p>
                  </>
                ) : (
                  <>
                    <Link to="/login?role=student" className="btn btn--primary landing-hero__btn">
                      <span className="btn__shine" aria-hidden="true" />
                      <span className="btn__label">Войти как студент</span>
                    </Link>
                    <Link to="/login?role=employer" className="btn btn--secondary landing-hero__btn">
                      <span className="btn__label">Войти как HR</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="landing-hero__visual">
              <LandingQrVerifyDemo />
            </div>
          </div>
        </section>

        <section id="benefits" className="landing-section landing-section--benefits">
          <header className="landing-section__head">
            <h2 className="landing-section__title">Почему это удобно всем сторонам</h2>
            <p className="landing-section__subtitle">
              Практические свойства, которые экономят время юридическим и HR-отделам и снимают напряжение у выпускников.
            </p>
          </header>
          <ul className="landing-benefits">
            {BENEFITS.map((b) => (
              <li key={b.title} className="landing-benefit">
                <span className={`landing-benefit__icon landing-benefit__icon--${b.icon}`} aria-hidden="true" />
                <h3 className="landing-benefit__title">{b.title}</h3>
                <p className="landing-benefit__text">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="how" className="landing-section landing-section--how">
          <header className="landing-section__head">
            <h2 className="landing-section__title">Как это работает</h2>
            <p className="landing-section__subtitle">
              Короткая цепочка от данных вуза до ответа для работодателя — без ручной пересылки сканов.
            </p>
          </header>
          <ol className="landing-steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="landing-step">
                <span className="landing-step__num" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="landing-step__body">
                  <h3 className="landing-step__title">{step.title}</h3>
                  <p className="landing-step__text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="audience" className="landing-section landing-section--audience">
          <header className="landing-section__head">
            <h2 className="landing-section__title">Три входа — одна экосистема</h2>
            <p className="landing-section__subtitle">
              Разные роли, разные сценарии, но общий реестр и единые правила безопасности.
            </p>
          </header>
          <ul className="landing-audience">
            {AUDIENCE.map((a) => (
              <li key={a.id} className={`landing-card landing-card--${a.accent}`}>
                <h3 className="landing-card__title">{a.title}</h3>
                <p className="landing-card__desc">{a.desc}</p>
                <Link to={a.to} className="landing-card__link">
                  {a.cta}
                  <span aria-hidden="true"> →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-cta" aria-labelledby="landing-cta-title">
          <div className="landing-cta__inner">
            <h2 id="landing-cta-title" className="landing-cta__title">
              {user ? "Продолжить работу в кабинете?" : "Авторизация для образовательных организаций"}
            </h2>
            <p className="landing-cta__text">
              {user
                ? "Вы уже вошли в систему — откройте свой кабинет или изучите материалы на странице."
                : "Если вы представляете вуз или колледж, войдите в отдельный кабинет образовательной организации для работы с реестром дипломов."}
            </p>
            <div className="landing-cta__actions">
              {user ? (
                <Link to={cabinetPath} className="btn btn--primary landing-cta__btn landing-cta__btn--cabinet">
                  <span className="btn__shine" aria-hidden="true" />
                  <span className="btn__label">Перейти в личный кабинет</span>
                </Link>
              ) : (
                <>
                  <Link to="/login/vuz" className="btn btn--primary landing-cta__btn">
                    <span className="btn__shine" aria-hidden="true" />
                    <span className="btn__label">Войти как ВУЗ</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          <p className="landing-footer__brand">
            <strong>DIASOFT</strong> — цифровые сервисы с упором на безопасность, масштаб и сопровождение.
          </p>
          <p className="landing-footer__admin-wrap">
            <Link to="/login/admin" className="landing-footer__admin">
              Вход администратора платформы
            </Link>
          </p>
          <p className="landing-footer__note">Демонстрационный стенд · 2026</p>
        </footer>
      </div>
    </AuthShell>
  );
}
