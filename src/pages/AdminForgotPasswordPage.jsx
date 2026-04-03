import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ROLES, cabinetPathForRole } from "../auth/authPaths.js";
import AuthShell from "../components/AuthShell.jsx";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

export default function AdminForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const { rippling, triggerRipple } = useSubmitRipple();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(cabinetPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email")?.toString().trim();
    if (!email) {
      setError("Введите логин администратора.");
      return;
    }
    try {
      await authApi.requestPasswordReset({ role: ROLES.admin, email });
    } catch {
      setError("Не удалось отправить запрос. Попробуйте позже.");
      return;
    }
    triggerRipple();
    setDone(true);
  };

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="forgot-admin-title">
        <div className="auth-card__glow" aria-hidden="true" />

        <p className="auth-badge">Администратор платформы</p>

        <h1 id="forgot-admin-title" className="auth-title">
          Восстановление пароля администратора
        </h1>
        <p className="auth-subtitle">
          Укажите рабочий логин. Инструкции и ссылка для сброса придут на привязанный к аккаунту адрес электронной
          почты.
        </p>

        {done ? (
          <>
            <p className="auth-success" role="status">
              Если учётная запись найдена, письмо отправлено. Ссылка одноразовая и ограничена по времени.
            </p>
            <p className="auth-crosslink">
              <Link to="/login/reset-password" className="link-muted">
                Уже есть ссылка из письма? Ввести новый пароль →
              </Link>
            </p>
            <p className="auth-crosslink">
              <Link to="/login/admin" className="link-muted">
                ← Вернуться ко входу
              </Link>
            </p>
          </>
        ) : (
          <>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}

            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <label className="field">
                <span className="field__label">Логин администратора</span>
                <input
                  type="text"
                  name="email"
                  autoComplete="username"
                  required
                  placeholder="admin@demo.diasoft"
                  className="field__input"
                />
              </label>

              <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`}>
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">Отправить ссылку</span>
              </button>
            </form>

            <p className="auth-crosslink">
              <Link to="/login/admin" className="link-muted">
                ← Вернуться ко входу в админ-панель
              </Link>
            </p>
          </>
        )}

        <p className="footer-note">Проблемы с доступом — через службу безопасности платформы.</p>
      </section>
    </AuthShell>
  );
}
