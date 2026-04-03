import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { cabinetPathForRole } from "../auth/authPaths.js";
import AuthShell from "../components/AuthShell.jsx";
import PasswordField from "../components/PasswordField.jsx";
import { useSubmitRipple } from "../hooks/useSubmitRipple.js";

const MIN_LEN = 8;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const { rippling, triggerRipple } = useSubmitRipple();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(cabinetPathForRole(user.role), { replace: true });
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("В ссылке нет ключа сброса. Откройте письмо ещё раз или запросите новое.");
      return;
    }
    if (password.length < MIN_LEN) {
      setError(`Пароль должен быть не короче ${MIN_LEN} символов.`);
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }
    try {
      await authApi.confirmPasswordReset({ token, newPassword: password });
    } catch {
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

        {!token && !done ? (
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
            <p className="auth-crosslink">
              <Link to="/login/admin" className="link-muted">
                Вход администратора
              </Link>
            </p>
          </>
        ) : null}

        {token && !done ? (
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
