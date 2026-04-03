import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ROLES, cabinetPathForRole } from "../auth/authPaths.js";
import { validateDemoCredentials } from "../auth/demoAccounts.js";
import AuthShell from "../components/AuthShell.jsx";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

export default function AdminLoginPage() {
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
    if (!validateDemoCredentials(ROLES.admin, login, password)) {
      setAuthError("Неверный логин или пароль.");
      return;
    }
    try {
      await authApi.login({ role: ROLES.admin, login, password });
    } catch {
      setAuthError("Не удалось связаться с сервером (заглушка API).");
      return;
    }
    triggerRipple();
    const persist = fd.get("remember") === "on";
    signIn({ role: ROLES.admin, login, persist });
    navigate(cabinetPathForRole(ROLES.admin));
  };

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="auth-title-admin">
        <div className="auth-card__glow" aria-hidden="true" />

        <p className="auth-badge">Администратор платформы</p>

        <h1 id="auth-title-admin" className="auth-title">
          Вход в админ-панель
        </h1>
        <p className="auth-subtitle">
          Управление учётными записями пользователей ВУЗов. Доступ только для операторов платформы DIASOFT.
        </p>

        {authError ? (
          <p className="auth-error" role="alert">
            {authError}
          </p>
        ) : null}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <input type="hidden" name="role" value="admin" />

          <label className="field">
            <span className="field__label">Логин администратора</span>
            <input
              type="text"
              name="login"
              autoComplete="username"
              required
              placeholder="admin@demo.diasoft"
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
              <input type="checkbox" name="remember" defaultChecked />
              <span className="checkbox__box" aria-hidden="true" />
              <span>Запомнить устройство (сохранять после закрытия браузера)</span>
            </label>
          </div>

          <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`}>
            <span className="btn__shine" aria-hidden="true" />
            <span className="btn__label">Войти в админ-панель</span>
          </button>
        </form>

        <div className="auth-demo" aria-label="Демо-логин администратора">
          <p className="auth-demo__title">Демо-доступ администратора</p>
          <table className="auth-demo__table">
            <tbody>
              <tr>
                <th scope="row">Логин</th>
                <td>
                  <code className="auth-demo__code">admin@demo.diasoft</code>
                </td>
              </tr>
              <tr>
                <th scope="row">Пароль</th>
                <td>
                  <code className="auth-demo__code">AdminDemo2026</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="auth-crosslink">
          <Link to="/" className="link-muted">
            ← На главную
          </Link>
        </p>

        <p className="footer-note">Рабочий доступ выдаётся службой безопасности платформы.</p>
      </section>
    </AuthShell>
  );
}
