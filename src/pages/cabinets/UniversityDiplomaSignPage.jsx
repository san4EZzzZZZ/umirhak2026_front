import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as universityRegistryApi from "../../api/universityRegistryApi.js";
import * as universityCapSigningApi from "../../api/universityCapSigningApi.js";
import { getStubCapPublicThumbprintHex, signDiplomaDraftWithStubKey } from "../../utils/universityCapSignStub.js";
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

  const [thumbprint, setThumbprint] = useState("…");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isValidDraft(draft)) {
      navigate("/cabinet/vuz", { replace: true });
    }
  }, [draft, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await getStubCapPublicThumbprintHex();
        if (!cancelled) setThumbprint(t);
      } catch {
        if (!cancelled) setThumbprint("недоступно");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSignAndCommit = useCallback(async () => {
    if (!isValidDraft(draft)) return;
    setError(null);
    setBusy(true);
    try {
      const sig = await signDiplomaDraftWithStubKey(draft);
      const pkg = {
        fullName: draft.fullName.trim(),
        year: Number(draft.year),
        specialty: draft.specialty.trim(),
        diplomaNumber: draft.diplomaNumber.trim(),
        signatureBase64: sig.signatureBase64,
        capAlgorithm: sig.capAlgorithm,
        signingKeyThumbprint: sig.signingKeyThumbprint,
        signedAt: sig.signedAt,
      };
      const stub = await universityCapSigningApi.submitSignedDiplomaPackageStub(pkg);
      if (!stub.accepted) {
        setError("Бэкенд отклонил пакет подписи (заглушка).");
        return;
      }
      await universityRegistryApi.commitSignedDiplomaRecord(pkg);
      navigate("/cabinet/vuz", { replace: true, state: { capSignedOk: true } });
    } catch {
      setError("Не удалось сформировать подпись или сохранить запись.");
    } finally {
      setBusy(false);
    }
  }, [draft, navigate]);

  if (!isValidDraft(draft)) {
    return null;
  }

  return (
    <CabinetShell
      badge="Личный кабинет ВУЗа"
      title="Подпись КЭП"
      subtitle="Демонстрация усиленной квалифицированной электронной подписи: на клиенте формируется подпись RSA-PSS (SHA-256) демо-ключом, затем пакет уходит на заглушку бэкенда и сохраняется в реестре."
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

        <h3 className="cap-sign-subtitle">Ключ подписи (демо)</h3>
        <p className="cabinet-card__hint">
          В прототипе используется зашитый тестовый закрытый ключ в коде страницы (только для стенда). В бою подпись выполняется через токен, облачную КЭП или серверное HSM — ключ не хранится в репозитории.
        </p>
        <p className="cabinet-mock" aria-label="Отпечаток открытого ключа">
          Отпечаток (SHA-256, превью): <strong>{thumbprint}</strong>
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
