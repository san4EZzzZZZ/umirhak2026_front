import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { cabinetPathForRole } from "../auth/authPaths.js";
import AuthShell from "../components/AuthShell.jsx";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

const ROLES = [
  { id: "student", label: "Выпускник", tabId: "tab-forgot-student" },
  { id: "employer", label: "HR работодатель", tabId: "tab-forgot-employer" },
];

const ROLE_COPY = {
  student: "Укажите email, который вы использовали при регистрации.",
  employer: "Укажите email, который вы использовали при регистрации.",
};

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "employer" ? "employer" : "student";
  const [activeRole, setActiveRole] = useState(initialRole);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const { rippling, triggerRipple } = useSubmitRipple();
  const { user } = useAuth();
  const navigate = useNavigate();
  const tabRefs = useRef([]);

  useEffect(() => {
    if (user) navigate(cabinetPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    setError(null);
  }, [activeRole]);

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

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email")?.toString().trim();
    if (!email) {
      setError("Введите email.");
      return;
    }
    try {
      await authApi.requestPasswordReset({ role: activeRole, email });
    } catch {
      setError("Не удалось отправить запрос. Попробуйте позже или обратитесь в поддержку.");
      return;
    }
    triggerRipple();
    setDone(true);
  };

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="forgot-title">
        <div className="auth-card__glow" aria-hidden="true" />

        <h1 id="forgot-title" className="auth-title">
          Восстановление пароля
        </h1>
        <p className="auth-subtitle">
          Мы отправим ссылку для сброса пароля на адрес, указанный при регистрации.
        </p>

        {done ? (
          <>
            <p className="auth-success" role="status">
              Если учётная запись с такими данными есть, письмо со ссылкой уже отправлено. Проверьте почту и папку
              «Спам». Ссылка действует ограниченное время.
            </p>
            <p className="auth-crosslink">
              <Link to="/login" className="link-muted">
                ← Вернуться ко входу
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="role-tabs role-tabs--two" role="tablist" aria-label="Тип пользователя">
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

            <p className="role-hint" id="forgot-role-description" role="status">
              {ROLE_COPY[activeRole]}
            </p>

            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}

            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  type="text"
                  name="email"
                  autoComplete="username"
                  required
                  placeholder={activeRole === "student" ? "student@mail.ru" : "hr@company.ru"}
                  className="field__input"
                  aria-describedby="forgot-role-description"
                />
              </label>

              <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`}>
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">Отправить ссылку</span>
              </button>
            </form>

            <p className="auth-crosslink">
              <Link to="/login" className="link-muted">
                ← Вернуться ко входу
              </Link>
            </p>
          </>
        )}

        <p className="footer-note">Не приходит письмо? Проверьте адрес электронной почты или обратитесь в поддержку</p>
      </section>
    </AuthShell>
  );
}
