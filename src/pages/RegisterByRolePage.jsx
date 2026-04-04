import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ROLES, cabinetPathForRole } from "../auth/authPaths.js";
import AuthShell from "../components/AuthShell.jsx";
import PasswordField from "../components/PasswordField.jsx";

const ROLE_TITLE = {
  [ROLES.student]: "Регистрация студента",
  [ROLES.employer]: "Регистрация HR",
};

const ROLE_SUBTITLE = {
  [ROLES.student]: "Создайте аккаунт студента для доступа к кабинету и выпуску QR/ссылки.",
  [ROLES.employer]: "Создайте аккаунт HR для проверки дипломов в реестре и по QR.",
};

const LOGIN_PLACEHOLDER = {
  [ROLES.student]: "student@mail.ru",
  [ROLES.employer]: "hr@company.ru",
};

export default function RegisterByRolePage({ role }) {
  const [authError, setAuthError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const safeRole = useMemo(() => (role === ROLES.employer ? ROLES.employer : ROLES.student), [role]);

  useEffect(() => {
    if (user) navigate(cabinetPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    const fd = new FormData(e.currentTarget);
    const email = fd.get("email")?.toString().trim() ?? "";
    const lastName = fd.get("lastName")?.toString().trim() ?? "";
    const firstName = fd.get("firstName")?.toString().trim() ?? "";
    const middleName = fd.get("middleName")?.toString().trim() ?? "";
    const password = fd.get("password")?.toString() ?? "";
    const passwordConfirm = fd.get("passwordConfirm")?.toString() ?? "";

    if (!email && !password) {
      setAuthError("Введите email и пароль.");
      return;
    }
    if (!email) {
      setAuthError("Введите email.");
      return;
    }
    if (!lastName || !firstName) {
      setAuthError("Введите фамилию и имя.");
      return;
    }
    if (!password) {
      setAuthError("Введите пароль.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Пароль должен быть не короче 6 символов.");
      return;
    }
    if (password !== passwordConfirm) {
      setAuthError("Пароли не совпадают.");
      return;
    }

    const fullName = [lastName, firstName, middleName].filter(Boolean).join(" ").trim();

    try {
      if (safeRole === ROLES.student) {
        await authApi.registerStudent({ email, fullName, password, confirmPassword: passwordConfirm });
      } else {
        await authApi.registerEmployer({ email, fullName, password, confirmPassword: passwordConfirm });
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Ошибка регистрации");
      return;
    }

    const roleForLogin = safeRole === ROLES.employer ? "employer" : "student";
    navigate(`/login?registered=1&role=${encodeURIComponent(roleForLogin)}&login=${encodeURIComponent(email)}`);
  };

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="auth-title-register">
        <div className="auth-card__glow" aria-hidden="true" />

        <h1 id="auth-title-register" className="auth-title">
          {ROLE_TITLE[safeRole]}
        </h1>
        <p className="auth-subtitle">{ROLE_SUBTITLE[safeRole]}</p>

        <p
          className={`auth-error${authError ? " is-visible" : ""}`}
          role={authError ? "alert" : undefined}
          aria-live="polite"
          aria-hidden={!authError}
        >
          {authError ?? ""}
        </p>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              placeholder={LOGIN_PLACEHOLDER[safeRole]}
              className="field__input"
            />
          </label>

          <label className="field">
            <span className="field__label">Фамилия</span>
            <input type="text" name="lastName" autoComplete="family-name" required className="field__input" />
          </label>

          <label className="field">
            <span className="field__label">Имя</span>
            <input type="text" name="firstName" autoComplete="given-name" required className="field__input" />
          </label>

          <label className="field">
            <span className="field__label">Отчество (если есть)</span>
            <input type="text" name="middleName" autoComplete="additional-name" className="field__input" />
          </label>

          <PasswordField
            label="Пароль"
            name="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />
          <PasswordField
            label="Повторите пароль"
            name="passwordConfirm"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />

          <button type="submit" className="btn btn--primary">
            <span className="btn__shine" aria-hidden="true" />
            <span className="btn__label">Зарегистрироваться</span>
          </button>
        </form>

        <p className="auth-crosslink">
          <Link to="/login" className="link-muted">
            Уже есть аккаунт? Войти
          </Link>
        </p>

        <p className="auth-crosslink">
          <Link to="/" className="link-muted">
            ← На главную
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}
