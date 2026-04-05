import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ROLES, cabinetPathForRole } from "../auth/authPaths.js";
import AuthShell from "../components/AuthShell.jsx";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

export default function UniversityForgotPasswordPage() {
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
      setError("Введите email или логин ВУЗа.");
      return;
    }
    try {
      await authApi.requestPasswordReset({ role: ROLES.university, email });
    } catch {
      setError("Не удалось отправить запрос. Попробуйте позже или свяжитесь с поддержкой DIASOFT.");
      return;
    }
    triggerRipple();
    setDone(true);
  };

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="forgot-vuz-title">
        <div className="auth-card__glow" aria-hidden="true" />

        <p className="auth-badge">Личный кабинет ВУЗа</p>

        <h1 id="forgot-vuz-title" className="auth-title">
          Восстановление пароля ВУЗа
        </h1>
        <p className="auth-subtitle">
          Укажите email или логин учётной записи образовательной организации. На почту придёт ссылка для создания
          нового пароля.
        </p>

        {done ? (
          <>
            <p className="auth-success" role="status">
              Если такой аккаунт зарегистрирован, письмо со ссылкой отправлено. Проверьте входящие и «Спам».
            </p>
            <p className="auth-crosslink">
              <Link to="/login/vuz" className="link-muted">
                ← Вернуться ко входу ВУЗа
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
                <span className="field__label">Email или логин ВУЗа</span>
                <input
                  type="text"
                  name="email"
                  autoComplete="username"
                  required
                  placeholder="registrar@university.ru"
                  className="field__input"
                />
              </label>

              <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`}>
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">Отправить ссылку</span>
              </button>
            </form>

            <p className="auth-crosslink">
              <Link to="/login/vuz" className="link-muted">
                ← Вернуться ко входу ВУЗа
              </Link>
            </p>

            <p className="auth-crosslink">
              <Link to="/login/forgot-password" className="link-muted">
                Студент или работодатель? Восстановление для другой роли
              </Link>
            </p>
          </>
        )}

        <p className="footer-note">Нет доступа к почте? Обратитесь к координатору проекта.</p>
      </section>
    </AuthShell>
  );
}
