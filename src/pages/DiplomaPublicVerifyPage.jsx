import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as publicVerifyApi from "../api/publicVerifyApi.js";
import AuthShell from "../components/AuthShell.jsx";

function prettyCheckedAt(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return "";
  }
}

export default function DiplomaPublicVerifyPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await publicVerifyApi.verifyStudentLinkToken(token);
        if (!cancelled) setResult(payload);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось проверить ссылку.");
          setResult(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const valid = Boolean(result?.valid);

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="diploma-verify-title">
        <div className="auth-card__glow" aria-hidden="true" />
        <h1 id="diploma-verify-title" className="auth-title">
          Проверка диплома
        </h1>
        <p className="auth-subtitle">Публичная проверка QR-ссылки выпускника.</p>

        {loading ? <p className="auth-subtitle">Проверяем ссылку…</p> : null}
        {error ? (
          <p className="auth-error is-visible" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && result ? (
          <div className={`public-verify-result${valid ? " is-valid" : " is-invalid"}`}>
            <div className={`public-verify-result__icon${valid ? " is-valid" : " is-invalid"}`} aria-hidden="true">
              {valid ? "✓" : "✕"}
            </div>
            <div>
              <p className="public-verify-result__title">{valid ? "Диплом валидный" : "Диплом не валиден"}</p>
              <p className="auth-subtitle" style={{ marginTop: "0.4rem" }}>
                {valid ? "Запись найдена в реестре и активна." : result.reason || "Ссылка недействительна."}
              </p>
            </div>
          </div>
        ) : null}

        {!loading && !error && valid ? (
          <dl className="public-verify-fields">
            <div>
              <dt>ФИО</dt>
              <dd>{result.fullName || "Не указано"}</dd>
            </div>
            <div>
              <dt>ВУЗ</dt>
              <dd>{result.universityName ? `${result.universityCode || ""} · ${result.universityName}` : result.universityCode || "Не указано"}</dd>
            </div>
            <div>
              <dt>Специальность</dt>
              <dd>{result.specialty || "Не указано"}</dd>
            </div>
            <div>
              <dt>Проверено</dt>
              <dd>{prettyCheckedAt(result.checkedAt) || "Сейчас"}</dd>
            </div>
          </dl>
        ) : null}

        <p className="auth-crosslink">
          <Link to="/" className="link-muted">
            ← На главную
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}
