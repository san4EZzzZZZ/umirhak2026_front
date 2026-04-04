/** Вход студент/HR через Kotlin API: src/api/authApi.js */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as authApi from "./api/authApi.js";
import { useAuth } from "./auth/AuthContext.jsx";
import { cabinetPathForRole } from "./auth/authPaths.js";
import AuthShell from "./components/AuthShell.jsx";
import DemoCredentialsPanel from "./components/DemoCredentialsPanel.jsx";
import PasswordField from "./components/PasswordField.jsx";
import { toSessionProfileFromFullName } from "./auth/sessionProfile.js";
import { useSubmitRipple } from "./hooks/useSubmitRipple.js";

const ROLES = [
  { id: "student", label: "Студент", tabId: "tab-student", registerPath: "/register/student" },
  { id: "employer", label: "HR работодатель", tabId: "tab-employer", registerPath: "/register/hr" },
];

const ROLE_COPY = {
  student: "Просмотр своих данных и выпуск QR-кода или ссылки для проверки.",
  employer: "Поиск по реестру, проверка по QR и работа с обращениями.",
};

export default function LoginPage() {
  const [activeRole, setActiveRole] = useState("student");
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  const [loginValue, setLoginValue] = useState("");
  const { rippling, triggerRipple } = useSubmitRipple();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabRefs = useRef([]);

  useEffect(() => {
    if (user) navigate(cabinetPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    setAuthError(null);
  }, [activeRole]);

  useEffect(() => {
    const registered = searchParams.get("registered");
    const roleFromUrl = searchParams.get("role");
    const loginFromUrl = searchParams.get("login");

    if (roleFromUrl === "student" || roleFromUrl === "employer" || roleFromUrl === "hr") {
      setActiveRole(roleFromUrl === "hr" ? "employer" : roleFromUrl);
    }
    if (loginFromUrl) {
      setLoginValue(loginFromUrl);
    }

    if (registered === "1") {
      setAuthSuccess("Регистрация прошла успешно. Войдите под своими данными.");
      const next = new URLSearchParams(searchParams);
      next.delete("registered");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
    setAuthError(null);
    setAuthSuccess(null);
    const fd = new FormData(e.currentTarget);
    const login = loginValue.trim();
    const password = fd.get("password")?.toString() ?? "";
    if (!login && !password) {
      setAuthError("Введите логин и пароль.");
      return;
    }
    if (!login) {
      setAuthError("Введите логин.");
      return;
    }
    if (!password) {
      setAuthError("Введите пароль.");
      return;
    }

    let authResult;
    try {
      authResult = await authApi.login({ role: activeRole, login, password });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Ошибка авторизации");
      return;
    }
    triggerRipple();
    const persist = fd.get("remember") === "on";
    const { firstName, lastName } = toSessionProfileFromFullName(authResult?.fullName);
    signIn({
      role: authResult?.role ?? activeRole,
      login: authResult?.login ?? login,
      persist,
      firstName,
      lastName,
    });
    navigate(cabinetPathForRole(authResult?.role ?? activeRole));
  };

  const registerPath = ROLES.find((r) => r.id === activeRole)?.registerPath ?? "/register/student";

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card__glow" aria-hidden="true" />

        <h1 id="auth-title" className="auth-title">
          Вход в личный кабинет
        </h1>
        <p className="auth-subtitle">
          Выберите роль и войдите с учётными данными. Представители ВУЗов проходят вход на{" "}
          <Link to="/login/vuz" className="auth-subtitle__link">
            отдельной странице
          </Link>
          .
        </p>

        <p className="auth-crosslink auth-crosslink--top">
          <Link to="/login/vuz" className="link-muted">
            Вход для ВУЗа →
          </Link>
        </p>

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

        <p className="role-hint" id="role-description" role="status">
          {ROLE_COPY[activeRole]}
        </p>

        <p
          className={`auth-error${authError ? " is-visible" : ""}`}
          role={authError ? "alert" : undefined}
          aria-live="polite"
          aria-hidden={!authError}
        >
          {authError ?? ""}
        </p>
        {authSuccess ? <p className="auth-success">{authSuccess}</p> : null}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <input type="hidden" name="role" value={activeRole} />

          <label className="field">
            <span className="field__label">Email или логин</span>
            <input
              type="email"
              name="login"
              autoComplete="username"
              required
              placeholder={activeRole === "student" ? "student@mail.ru" : "hr@company.ru"}
              className="field__input"
              value={loginValue}
              onChange={(ev) => setLoginValue(ev.target.value)}
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
            <Link to={`/login/forgot-password?role=${activeRole}`} className="link-muted">
              Забыли пароль?
            </Link>
          </div>

          <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`}>
            <span className="btn__shine" aria-hidden="true" />
            <span className="btn__label">Войти</span>
          </button>
        </form>

        <p className="auth-crosslink">
          <Link to={registerPath} className="link-muted">
            Нет аккаунта? Зарегистрироваться
          </Link>
        </p>

        <DemoCredentialsPanel />

        <p className="auth-crosslink">
          <Link to="/" className="link-muted">
            ← На главную
          </Link>
        </p>

        <p className="footer-note">Нет доступа? Обратитесь к администратору вашей организации.</p>
      </section>
    </AuthShell>
  );
}
