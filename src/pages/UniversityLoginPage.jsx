import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

export default function UniversityLoginPage() {
  const { rippling, triggerRipple } = useSubmitRipple();

  const onSubmit = (e) => {
    e.preventDefault();
    triggerRipple();
  };

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="auth-title-vuz">
        <div className="auth-card__glow" aria-hidden="true" />

        <p className="auth-badge">Личный кабинет ВУЗа</p>

        <h1 id="auth-title-vuz" className="auth-title">
          Вход для образовательной организации
        </h1>
        <p className="auth-subtitle">
          Загрузка реестров выпускников, подписание данных и ведение учётных записей. Используйте учётные данные,
          выданные администратором платформы.
        </p>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <input type="hidden" name="role" value="university" />

          <label className="field">
            <span className="field__label">Email или логин ВУЗа</span>
            <input
              type="text"
              name="login"
              autoComplete="username"
              required
              placeholder="registrar@university.ru"
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
            <span className="btn__label">Войти в кабинет ВУЗа</span>
          </button>
        </form>

        <p className="auth-crosslink">
          <Link to="/" className="link-muted">
            Студент или работодатель? Вход по другой роли
          </Link>
        </p>

        <p className="footer-note">Нет доступа? Обратитесь к координатору проекта или в службу поддержки DIASOFT.</p>
      </section>
    </AuthShell>
  );
}
