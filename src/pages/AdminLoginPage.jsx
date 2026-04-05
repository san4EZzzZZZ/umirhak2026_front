import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { ROLES, cabinetPathForRole } from "../auth/authPaths.js";
import AuthShell from "../components/AuthShell.jsx";
import PasswordField from "../components/PasswordField.jsx";
import { toSessionProfileFromFullName } from "../auth/sessionProfile.js";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

export default function AdminLoginPage() {
  const [authError, setAuthError] = useState(null);
  const [stage, setStage] = useState("credentials");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState({ login: "", password: "", persist: true });
  const { rippling, triggerRipple } = useSubmitRipple();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(cabinetPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  const onSubmitCredentials = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const fd = new FormData(e.currentTarget);
    const login = fd.get("login")?.toString().trim() ?? "";
    const password = fd.get("password")?.toString() ?? "";
    const persist = fd.get("remember") === "on";
    if (!login || !password) {
      setAuthError("Введите логин и пароль.");
      return;
    }

    setBusy(true);
    try {
      await authApi.requestAdminLoginCode({ login, password });
      setPending({ login, password, persist });
      setStage("code");
      setCode("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Не удалось отправить код.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmitCode = async (e) => {
    e.preventDefault();
    setAuthError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setAuthError("Введите 6-значный код из письма.");
      return;
    }

    setBusy(true);
    try {
      const authResult = await authApi.loginAdminWithCode({
        login: pending.login,
        password: pending.password,
        code: code.trim(),
      });
      triggerRipple();
      const { firstName, lastName } = toSessionProfileFromFullName(authResult?.fullName);
      signIn({
        role: ROLES.admin,
        login: authResult?.login ?? pending.login,
        persist: pending.persist,
        firstName,
        lastName,
      });
      navigate(cabinetPathForRole(ROLES.admin));
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Не удалось войти.");
    } finally {
      setBusy(false);
    }
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
          Вход администратора выполняется в 2 шага: пароль и код подтверждения из письма.
        </p>

        <p
          className={`auth-error${authError ? " is-visible" : ""}`}
          role={authError ? "alert" : undefined}
          aria-live="polite"
          aria-hidden={!authError}
        >
          {authError ?? ""}
        </p>

        {stage === "credentials" ? (
          <form className="auth-form" onSubmit={onSubmitCredentials} noValidate>
            <label className="field">
              <span className="field__label">Логин администратора (email)</span>
              <input
                type="email"
                name="login"
                autoComplete="username"
                required
                placeholder="admin@example.com"
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
                <span>Запомнить устройство</span>
              </label>
              <Link to="/login/admin/forgot-password" className="link-muted">
                Забыли пароль?
              </Link>
            </div>

            <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`} disabled={busy}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">{busy ? "Отправка…" : "Получить код на почту"}</span>
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={onSubmitCode} noValidate>
            <p className="auth-subtitle" style={{ marginBottom: "0.35rem" }}>
              Код отправлен на <strong>{pending.login}</strong>.
            </p>
            <label className="field">
              <span className="field__label">Код из письма</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder="123456"
                className="field__input"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </label>

            <div className="cabinet-actions" style={{ marginTop: "0.85rem" }}>
              <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`} disabled={busy}>
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">{busy ? "Проверка…" : "Войти в админ-панель"}</span>
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => {
                  setStage("credentials");
                  setCode("");
                  setAuthError(null);
                }}
              >
                <span className="btn__label">Изменить логин/пароль</span>
              </button>
            </div>
          </form>
        )}

        <p className="auth-crosslink">
          <Link to="/" className="link-muted">
            ← На главную
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}

