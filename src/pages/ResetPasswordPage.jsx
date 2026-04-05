import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { cabinetPathForRole } from "../auth/authPaths.js";
import AuthShell from "../components/AuthShell.jsx";
import PasswordField from "../components/PasswordField.jsx";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

const MIN_LEN = 8;

function passwordChecks(password) {
  const value = String(password ?? "");
  const hasNonLatinLetter = /[^\x00-\x7F]/.test(value) && /[\p{L}]/u.test(value);
  return {
    minLength: value.length >= MIN_LEN,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
    latinLettersOnly: !hasNonLatinLetter,
  };
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const { token: tokenFromPath } = useParams();
  const token = useMemo(() => {
    const pathToken = tokenFromPath?.trim() ?? "";
    if (pathToken) return pathToken;
    return searchParams.get("token")?.trim() ?? "";
  }, [searchParams, tokenFromPath]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [tokenState, setTokenState] = useState(token ? "checking" : "missing");
  const { rippling, triggerRipple } = useSubmitRipple();
  const { user } = useAuth();
  const navigate = useNavigate();
  const checks = useMemo(() => passwordChecks(password), [password]);
  const isPasswordStrong = checks.minLength && checks.lower && checks.upper && checks.special && checks.latinLettersOnly;

  useEffect(() => {
    if (user) navigate(cabinetPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!token) {
        setTokenState("missing");
        return;
      }
      setTokenState("checking");
      try {
        const { active } = await authApi.validatePasswordResetToken(token);
        if (!cancelled) {
          setTokenState(active ? "active" : "invalid");
        }
      } catch {
        if (!cancelled) {
          setTokenState("invalid");
        }
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("В ссылке нет ключа сброса. Откройте письмо ещё раз или запросите новое.");
      return;
    }
    if (tokenState !== "active") {
      setError("Ссылка восстановления неактивна. Запросите новую.");
      return;
    }
    if (!isPasswordStrong) {
      if (!checks.latinLettersOnly) {
        setError("В пароле разрешены только латинские буквы.");
      } else {
        setError("Пароль не соответствует требованиям.");
      }
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }
    try {
      await authApi.confirmPasswordReset({ token, newPassword: password });
    } catch {
      setTokenState("invalid");
      setError("Ссылка устарела или уже использована. Запросите восстановление пароля снова.");
      return;
    }
    triggerRipple();
    setDone(true);
    setPassword("");
    setConfirm("");
  };

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="reset-title">
        <div className="auth-card__glow" aria-hidden="true" />

        <h1 id="reset-title" className="auth-title">
          Новый пароль
        </h1>
        <p className="auth-subtitle">
          Введите новый пароль для учётной записи. После сохранения войдите с ним на странице входа.
        </p>

        {tokenState === "missing" && !done ? (
          <>
            <p className="auth-error" role="alert">
              Не найден параметр <code className="auth-demo__code">token</code> в адресе страницы. Скопируйте ссылку
              из письма целиком или нажмите кнопку в письме ещё раз.
            </p>
            <p className="auth-crosslink">
              <Link to="/login/forgot-password" className="link-muted">
                Запросить письмо для студента / работодателя
              </Link>
            </p>
            <p className="auth-crosslink">
              <Link to="/login/vuz/forgot-password" className="link-muted">
                Восстановление для ВУЗа
              </Link>
            </p>
            <p className="auth-crosslink">
              <Link to="/login" className="link-muted">
                ← На страницу входа
              </Link>
            </p>
          </>
        ) : null}

        {tokenState === "invalid" && !done ? (
          <>
            <p className="auth-error is-visible" role="alert">
              Ссылка восстановления неактивна: истекла, уже использована или неверна.
            </p>
            <p className="auth-crosslink">
              <Link to="/login/forgot-password" className="link-muted">
                Запросить новую ссылку
              </Link>
            </p>
            <p className="auth-crosslink">
              <Link to="/login" className="link-muted">
                ← На страницу входа
              </Link>
            </p>
          </>
        ) : null}

        {tokenState === "checking" && !done ? (
          <p className="auth-subtitle" role="status">
            Проверяем ссылку восстановления…
          </p>
        ) : null}

        {token && done ? (
          <>
            <p className="auth-success" role="status">
              Пароль обновлён. Теперь можно войти с новым паролем.
            </p>
            <p className="auth-crosslink">
              <Link to="/login" className="link-muted">
                Вход студента / работодателя
              </Link>
            </p>
            <p className="auth-crosslink">
              <Link to="/login/vuz" className="link-muted">
                Вход ВУЗа
              </Link>
            </p>
          </>
        ) : null}

        {tokenState === "active" && token && !done ? (
          <>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}

            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <PasswordField
                label="Новый пароль"
                name="password"
                autoComplete="new-password"
                required
                minLength={MIN_LEN}
                placeholder="Не короче 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <ul className="password-rules" aria-live="polite">
                <li className={`password-rules__item${checks.minLength ? " is-met" : ""}`}>Минимум 8 символов</li>
                <li className={`password-rules__item${checks.lower ? " is-met" : ""}`}>Есть строчная буква</li>
                <li className={`password-rules__item${checks.upper ? " is-met" : ""}`}>Есть прописная буква</li>
                <li className={`password-rules__item${checks.special ? " is-met" : ""}`}>Есть спецсимвол</li>
                <li className={`password-rules__item${checks.latinLettersOnly ? " is-met" : ""}`}>
                  Только латинские буквы
                </li>
              </ul>
              <PasswordField
                label="Повторите пароль"
                name="confirm"
                autoComplete="new-password"
                required
                minLength={MIN_LEN}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              <button type="submit" className={`btn btn--primary${rippling ? " is-rippling" : ""}`}>
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">Сохранить пароль</span>
              </button>
            </form>

            <p className="auth-crosslink">
              <Link to="/login" className="link-muted">
                ← Отмена, на страницу входа
              </Link>
            </p>
          </>
        ) : null}

        <p className="footer-note">Если вы не запрашивали сброс, проигнорируйте письмо и пароль не меняйте.</p>
      </section>
    </AuthShell>
  );
}
