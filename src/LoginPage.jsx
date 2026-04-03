import { useCallback, useRef, useState } from "react";

const ROLES = [
  { id: "university", label: "ВУЗ", tabId: "tab-university" },
  { id: "student", label: "Студент", tabId: "tab-student" },
  { id: "employer", label: "HR работодатель", tabId: "tab-employer" },
];

const ROLE_COPY = {
  university: "Загрузка реестров, подписание данных и ведение выпускников.",
  student: "Просмотр своих данных и выпуск QR-кода или ссылки для проверки.",
  employer: "Поиск по реестру, проверка по QR и работа с обращениями.",
};

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState("university");
  const [rippling, setRippling] = useState(false);
  const tabRefs = useRef([]);

  const focusTab = useCallback((index) => {
    tabRefs.current[index]?.focus();
  }, []);

  const onTabKeyDown = useCallback(
    (e, index) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next =
        e.key === "ArrowRight"
          ? (index + 1) % ROLES.length
          : (index - 1 + ROLES.length) % ROLES.length;
      setActiveRole(ROLES[next].id);
      focusTab(next);
    },
    [focusTab]
  );

  const triggerRipple = useCallback(() => {
    setRippling(false);
    requestAnimationFrame(() => {
      setRippling(true);
      window.setTimeout(() => setRippling(false), 600);
    });
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    triggerRipple();
  };

  return (
    <>
      <div className="page-bg" aria-hidden="true">
        <div className="blob blob--1" />
        <div className="blob blob--2" />
        <div className="blob blob--3" />
        <div className="grid-overlay" />
      </div>

      <header className="top-bar">
        <a className="brand" href="/" aria-label="DIASOFT">
          <span className="brand__mark" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#ffffff" />
              <path
                d="M8 28c8-12 8-20 24-20"
                stroke="#0a0a18"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M10 22c6-8 10-12 20-12"
                stroke="#0a0a18"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.65"
              />
            </svg>
          </span>
          <span className="brand__text">
            <span className="brand__name">DIASOFT</span>
            <span className="brand__tag">всё по-настоящему</span>
          </span>
        </a>
        <p className="top-bar__hint">Проверка дипломов · единый реестр</p>
      </header>

      <main className="main">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card__glow" aria-hidden="true" />

          <h1 id="auth-title" className="auth-title">
            Вход в личный кабинет
          </h1>
          <p className="auth-subtitle">Выберите роль и войдите с учётными данными организации</p>

          <div className="role-tabs" role="tablist" aria-label="Тип пользователя">
            {ROLES.map((role, index) => (
              <button
                key={role.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                className={`role-tab${activeRole === role.id ? " is-active" : ""}`}
                role="tab"
                id={role.tabId}
                aria-selected={activeRole === role.id}
                onClick={() => setActiveRole(role.id)}
                onKeyDown={(e) => onTabKeyDown(e, index)}
              >
                {role.label}
              </button>
            ))}
          </div>

          <p className="role-hint" id="role-description" role="status">
            {ROLE_COPY[activeRole]}
          </p>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <label className="field">
              <span className="field__label">Email или логин</span>
              <input
                type="text"
                name="login"
                autoComplete="username"
                required
                placeholder="name@university.ru"
                className="field__input"
              />
            </label>
            <label className="field">
              <span className="field__label">Пароль</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="field__input"
              />
            </label>

            <div className="form-row">
              <label className="checkbox">
                <input type="checkbox" name="remember" />
                <span className="checkbox__box" aria-hidden="true" />
                <span>Запомнить устройство</span>
              </label>
              <a href="#" className="link-muted">
                Забыли пароль?
              </a>
            </div>

            <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">Войти</span>
            </button>
          </form>

          <p className="footer-note">Нет доступа? Обратитесь к администратору вашей организации.</p>
        </section>
      </main>
    </>
  );
}
