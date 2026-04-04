import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ROLES, cabinetPathForRole } from "../auth/authPaths.js";
import AuthShell from "../components/AuthShell.jsx";
import DemoCredentialsPanel from "../components/DemoCredentialsPanel.jsx";
import PasswordField from "../components/PasswordField.jsx";
import { toSessionProfileFromFullName } from "../auth/sessionProfile.js";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

export default function UniversityLoginPage() {
  const [authError, setAuthError] = useState(null);
  const { rippling, triggerRipple } = useSubmitRipple();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(cabinetPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const fd = new FormData(e.currentTarget);
    const login = fd.get("login")?.toString().trim();
    const password = fd.get("password")?.toString() ?? "";
    if (!login) return;
    let authResult;
    try {
      authResult = await authApi.login({ role: ROLES.university, login, password });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Ошибка авторизации");
      return;
    }
    triggerRipple();
    const persist = fd.get("remember") === "on";
    const { firstName, lastName } = toSessionProfileFromFullName(authResult?.fullName);
    signIn({
      role: authResult?.role ?? ROLES.university,
      login: authResult?.login ?? login,
      persist,
      firstName,
      lastName,
    });
    navigate(cabinetPathForRole(authResult?.role ?? ROLES.university));
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

        <p
          className={`auth-error${authError ? " is-visible" : ""}`}
          role={authError ? "alert" : undefined}
          aria-live="polite"
          aria-hidden={!authError}
        >
          {authError ?? ""}
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
          <PasswordField
            label="Пароль"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />

          <div className="form-row">
            <label className="checkbox">
              <input type="checkbox" name="remember" defaultChecked />
              <span className="checkbox__box" aria-hidden="true" />
              <span>Запомнить устройство (сохранять после закрытия браузера)</span>
            </label>
            <Link to="/login/vuz/forgot-password" className="link-muted">
              Забыли пароль?
            </Link>
          </div>

          <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`}>
            <span className="btn__shine" aria-hidden="true" />
            <span className="btn__label">Войти в кабинет ВУЗа</span>
          </button>
        </form>

        <DemoCredentialsPanel />

        <p className="auth-crosslink">
          <Link to="/login" className="link-muted">
            Студент или работодатель? Вход по другой роли
          </Link>
        </p>

        <p className="auth-crosslink">
          <Link to="/" className="link-muted">
            ← На главную
          </Link>
        </p>

        <p className="footer-note">Нет доступа? Обратитесь к координатору проекта или в службу поддержки DIASOFT.</p>
      </section>
    </AuthShell>
  );
}
