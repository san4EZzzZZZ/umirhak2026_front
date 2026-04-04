import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as universityRegistryApi from "../../api/universityRegistryApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

function isValidDraft(d) {
  if (!d || typeof d !== "object") return false;
  const year = Number(d.year);
  return (
    typeof d.fullName === "string" &&
    d.fullName.trim().length > 0 &&
    typeof d.specialty === "string" &&
    d.specialty.trim().length > 0 &&
    typeof d.diplomaNumber === "string" &&
    d.diplomaNumber.trim().length > 0 &&
    Number.isFinite(year) &&
    year >= 1950 &&
    year <= 2100
  );
}

export default function UniversityDiplomaSignPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = location.state?.draft;

  const [privateKeyFileName, setPrivateKeyFileName] = useState("");
  const [privateKeyHash, setPrivateKeyHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isValidDraft(draft)) {
      navigate("/cabinet/vuz", { replace: true });
    }
  }, [draft, navigate]);

  const toHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const onPrivateKeyChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPrivateKeyFileName("");
      setPrivateKeyHash("");
      return;
    }
    try {
      const content = await file.text();
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
      setPrivateKeyHash(toHex(digest));
      setPrivateKeyFileName(file.name);
      setError(null);
    } catch {
      setPrivateKeyFileName("");
      setPrivateKeyHash("");
      setError("Не удалось прочитать файл приватного ключа.");
    }
  }, []);

  const onSignAndCommit = useCallback(async () => {
    if (!isValidDraft(draft)) return;
    if (!privateKeyHash) {
      setError("Загрузите приватный ключ КЭП.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const pkg = {
        fullName: draft.fullName.trim(),
        year: Number(draft.year),
        specialty: draft.specialty.trim(),
        diplomaNumber: draft.diplomaNumber.trim(),
        privateKeyHash,
      };
      await universityRegistryApi.commitSignedDiplomaRecord(pkg);
      navigate("/cabinet/vuz", { replace: true, state: { capSignedOk: true } });
    } catch {
      setError("Не удалось сформировать подпись или сохранить запись.");
    } finally {
      setBusy(false);
    }
  }, [draft, navigate, privateKeyHash]);

  if (!isValidDraft(draft)) {
    return null;
  }

  return (
    <CabinetShell
      badge="Личный кабинет ВУЗа"
      title="Подпись КЭП"
      subtitle="Загрузите приватный ключ КЭП: его SHA-256 хэш включается в общий хэш записи диплома перед сохранением в реестр."
    >
      <p className="cabinet-section-lead" style={{ marginTop: 0 }}>
        <Link to="/cabinet/vuz" className="cap-sign-back">
          ← К реестру дипломов
        </Link>
      </p>

      <div className="cabinet-card admin-form-card cap-sign-card">
        <h2 className="cabinet-card__title">Данные для внесения в реестр</h2>
        <dl className="cap-sign-dl">
          <div>
            <dt>ФИО</dt>
            <dd>{draft.fullName.trim()}</dd>
          </div>
          <div>
            <dt>Год выпуска</dt>
            <dd>{draft.year}</dd>
          </div>
          <div className="cap-sign-dl__full">
            <dt>Специальность</dt>
            <dd>{draft.specialty.trim()}</dd>
          </div>
          <div className="cap-sign-dl__full">
            <dt>Номер диплома</dt>
            <dd>{draft.diplomaNumber.trim()}</dd>
          </div>
        </dl>

        <h3 className="cap-sign-subtitle">Приватный ключ КЭП</h3>
        <p className="cabinet-card__hint">
          Выберите файл приватного ключа (например, `.pem`/`.key`). В систему уходит только его SHA-256 хэш.
        </p>
        <label className="cabinet-field" style={{ marginTop: "0.75rem" }}>
          <span className="cabinet-field__label">Файл приватного ключа</span>
          <input
            className="cabinet-field__input"
            type="file"
            accept=".pem,.key,.txt,application/x-pem-file,text/plain"
            onChange={onPrivateKeyChange}
            disabled={busy}
          />
        </label>
        <p className="cabinet-mock" aria-label="Отпечаток приватного ключа">
          {privateKeyHash ? (
            <>
              Файл: <strong>{privateKeyFileName}</strong>
              <br />
              SHA-256: <strong>{privateKeyHash}</strong>
            </>
          ) : (
            "Приватный ключ пока не загружен."
          )}
        </p>

        {error ? (
          <p className="auth-error" role="alert" style={{ marginTop: "0.85rem" }}>
            {error}
          </p>
        ) : null}

        <div className="cabinet-actions" style={{ marginTop: "1rem" }}>
          <button type="button" className="btn btn--primary" disabled={busy} onClick={onSignAndCommit}>
            <span className="btn__shine" aria-hidden="true" />
            <span className="btn__label">{busy ? "Подписание…" : "Подписать и внести в реестр"}</span>
          </button>
          <Link to="/cabinet/vuz" className="btn btn--secondary cap-sign-cancel">
            <span className="btn__label">Отмена</span>
          </Link>
        </div>
      </div>
    </CabinetShell>
  );
}
