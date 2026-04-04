import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as universityRegistryApi from "../../api/universityRegistryApi.js";
import { parseDiplomaImportFile } from "../../utils/parseDiplomaImport.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

const SIGN_ALGO = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function normalizePem(text) {
  return String(text ?? "").replace(/\r/g, "").trim();
}

function extractPemBody(pem, beginMarker, endMarker) {
  const normalized = normalizePem(pem);
  if (!normalized.includes(beginMarker) || !normalized.includes(endMarker)) return "";
  return normalized.replace(beginMarker, "").replace(endMarker, "").replace(/\s+/g, "");
}

function buildSigningPayload(row) {
  const canonical = [
    String(row.fullName ?? "").trim(),
    String(row.specialty ?? "").trim(),
    String(row.diplomaNumber ?? "").trim().toUpperCase(),
    String(Number(row.year)),
  ].join("|");
  return new TextEncoder().encode(canonical);
}

async function jwkToPemPublic(jwk) {
  const spki = {
    kty: "RSA",
    n: jwk.n,
    e: jwk.e,
    alg: "RS256",
    ext: true,
    key_ops: ["verify"],
  };
  const publicKey = await crypto.subtle.importKey("jwk", spki, SIGN_ALGO, true, ["verify"]);
  const spkiDer = await crypto.subtle.exportKey("spki", publicKey);
  const b64 = arrayBufferToBase64(spkiDer);
  const chunks = b64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PUBLIC KEY-----\n${chunks.join("\n")}\n-----END PUBLIC KEY-----`;
}

export default function UniversityCabinetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [capFlash, setCapFlash] = useState(null);
  const [busy, setBusy] = useState(false);
  const [diplomaFormError, setDiplomaFormError] = useState(null);
  const [bulkPreview, setBulkPreview] = useState({ rows: [], errors: [] });
  const [bulkMessage, setBulkMessage] = useState(null);
  const [annulDiplomaNumber, setAnnulDiplomaNumber] = useState("");
  const [annulFeedback, setAnnulFeedback] = useState(null);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkPrivateKey, setBulkPrivateKey] = useState(null);
  const [bulkPrivateKeyHash, setBulkPrivateKeyHash] = useState("");
  const [bulkPublicKeyPem, setBulkPublicKeyPem] = useState("");
  const [bulkSignError, setBulkSignError] = useState(null);

  const bulkKeyLoaded = useMemo(
    () => Boolean(bulkPrivateKey && bulkPrivateKeyHash && bulkPublicKeyPem),
    [bulkPrivateKey, bulkPrivateKeyHash, bulkPublicKeyPem]
  );

  useEffect(() => {
    if (location.state?.capSignedOk) {
      setCapFlash("Запись подписана КЭП и добавлена в реестр.");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!capFlash) return undefined;
    const id = setTimeout(() => setCapFlash(null), 9000);
    return () => clearTimeout(id);
  }, [capFlash]);

  const resetBulkSignState = () => {
    setBulkPrivateKey(null);
    setBulkPrivateKeyHash("");
    setBulkPublicKeyPem("");
    setBulkSignError(null);
  };

  const onGoToCapSign = (e) => {
    e.preventDefault();
    setDiplomaFormError(null);
    const fd = new FormData(e.currentTarget);
    const fullName = fd.get("fullName")?.toString().trim();
    const yearRaw = fd.get("year")?.toString().trim();
    const specialty = fd.get("specialty")?.toString().trim();
    const diplomaNumber = fd.get("diplomaNumber")?.toString().trim();
    const year = Number(yearRaw);
    if (!fullName || !specialty || !diplomaNumber) {
      setDiplomaFormError("Заполните все поля.");
      return;
    }
    if (!Number.isFinite(year) || year < 1950 || year > 2100) {
      setDiplomaFormError("Укажите корректный год выпуска (1950–2100).");
      return;
    }
    navigate("/cabinet/vuz/sign-diploma", {
      state: { draft: { fullName, year, specialty, diplomaNumber } },
    });
  };

  const onBulkFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setBulkMessage(null);
    setBulkModalOpen(false);
    resetBulkSignState();
    if (!file) {
      setBulkPreview({ rows: [], errors: [] });
      return;
    }
    setBusy(true);
    try {
      const result = await parseDiplomaImportFile(file);
      setBulkPreview(result);
      if (result.rows.length === 0 && result.errors.length === 0) {
        setBulkMessage("Не найдено ни одной строки с данными.");
      } else if (result.rows.length > 0) {
        setBulkMessage(`Распознано строк: ${result.rows.length}`);
      }
    } catch (err) {
      if (err?.message === "format") {
        setBulkPreview({ rows: [], errors: ["Допустимы файлы .csv, .xlsx или .xls"] });
      } else {
        setBulkPreview({ rows: [], errors: ["Не удалось прочитать файл."] });
      }
    } finally {
      setBusy(false);
    }
  };

  const onOpenBulkModal = () => {
    if (bulkPreview.rows.length === 0 || busy) return;
    setBulkSignError(null);
    setBulkModalOpen(true);
  };

  const onCloseBulkModal = () => {
    if (busy) return;
    setBulkModalOpen(false);
    resetBulkSignState();
  };

  const onBulkPrivateKeyChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetBulkSignState();
      return;
    }

    try {
      const content = await file.text();
      const normalizedPem = normalizePem(content);
      if (normalizedPem.includes("BEGIN PUBLIC KEY")) {
        event.target.value = "";
        throw new Error("Вы выбрали публичный ключ. Нужен приватный ключ.");
      }
      if (!normalizedPem.includes("-----BEGIN PRIVATE KEY-----")) {
        event.target.value = "";
        throw new Error("Нужен приватный ключ в формате PKCS#8 (BEGIN PRIVATE KEY).");
      }

      const body = extractPemBody(normalizedPem, "-----BEGIN PRIVATE KEY-----", "-----END PRIVATE KEY-----");
      if (!body) {
        event.target.value = "";
        throw new Error("Неверный формат PEM файла.");
      }

      const keyData = base64ToArrayBuffer(body);
      const importedPrivateKey = await crypto.subtle.importKey("pkcs8", keyData, SIGN_ALGO, true, ["sign"]);
      const jwk = await crypto.subtle.exportKey("jwk", importedPrivateKey);
      const exportedPublicPem = await jwkToPemPublic(jwk);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalizedPem));

      setBulkPrivateKey(importedPrivateKey);
      setBulkPrivateKeyHash(toHex(digest));
      setBulkPublicKeyPem(exportedPublicPem);
      setBulkSignError(null);
    } catch (err) {
      event.target.value = "";
      resetBulkSignState();
      setBulkSignError(err instanceof Error ? err.message : "Не удалось загрузить приватный ключ.");
    }
  };

  const onBulkSignAndUpload = async () => {
    if (bulkPreview.rows.length === 0) return;
    if (!bulkPrivateKey) {
      setBulkSignError("Ключ не выбран.");
      return;
    }
    if (!bulkKeyLoaded) {
      setBulkSignError("Загрузите корректный приватный ключ КЭП.");
      return;
    }

    setBusy(true);
    setBulkSignError(null);
    setBulkMessage(null);
    try {
      const signedRows = [];
      for (const row of bulkPreview.rows) {
        const payload = buildSigningPayload(row);
        const signature = await crypto.subtle.sign(SIGN_ALGO, bulkPrivateKey, payload);
        signedRows.push({
          ...row,
          privateKeyHash: bulkPrivateKeyHash,
          signatureBase64: arrayBufferToBase64(signature),
          publicKeyPem: bulkPublicKeyPem,
          signatureAlgorithm: "RSASSA-PKCS1-v1_5-SHA-256",
        });
      }

      await universityRegistryApi.addDiplomaRecordsBulk(signedRows);
      setBulkPreview({ rows: [], errors: [] });
      setBulkMessage(null);
      setCapFlash("Все записи подписаны КЭП и добавлены в реестр.");
      setBulkModalOpen(false);
      resetBulkSignState();
    } catch (error) {
      setBulkSignError(error instanceof Error ? error.message : "Ошибка подписи и импорта.");
    } finally {
      setBusy(false);
    }
  };

  const onAnnulDiploma = async () => {
    const n = annulDiplomaNumber.trim();
    setAnnulFeedback(null);
    if (!n) {
      setAnnulFeedback({ type: "err", text: "Введите номер диплома." });
      return;
    }
    setBusy(true);
    try {
      const preview = await universityRegistryApi.previewAnnulDiplomaByNumber(n);
      if (!preview.found) {
        setAnnulFeedback({ type: "err", text: "Диплом не найден." });
        return;
      }
      const label = n;
      const confirmed = window.confirm(`Вы уверены, что хотите аннулировать данный диплом?\nНомер: ${label}`);
      if (!confirmed) return;

      const { removed } = await universityRegistryApi.annulDiplomaByNumber(n);
      if (!removed) {
        setAnnulFeedback({ type: "err", text: "Не удалось аннулировать диплом." });
      } else {
        setAnnulFeedback({ type: "ok", text: `Диплом «${label}» успешно аннулирован.` });
        setAnnulDiplomaNumber("");
      }
    } catch {
      setAnnulFeedback({ type: "err", text: "Не удалось выполнить операцию." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CabinetShell
      badge="Личный кабинет ВУЗа"
      title="Реестр дипломов"
      subtitle="Добавление и импорт записей о выпускниках для единого реестра проверки дипломов."
    >
      {capFlash ? (
        <p className="cabinet-cap-flash" role="status">
          {capFlash}
        </p>
      ) : null}
      <h2 className="cabinet-section-title cabinet-section-title--balanced">Загрузка в реестр</h2>

      <div className="cabinet-grid cabinet-grid--2">
        <div className="cabinet-card admin-form-card">
          <h3 className="cabinet-card__title">Добавить один диплом</h3>
          <p className="cabinet-card__hint" style={{ marginBottom: "0.85rem" }}>
            После заполнения откроется шаг подписи КЭП, затем запись сохранится в реестре.
          </p>
          {diplomaFormError ? (
            <p className="auth-error is-visible" role="alert" aria-live="polite">
              {diplomaFormError}
            </p>
          ) : null}
          <form className="admin-user-form" onSubmit={onGoToCapSign}>
            <div className="admin-user-form__grid">
              <label className="cabinet-field">
                <span className="cabinet-field__label">ФИО</span>
                <input className="cabinet-field__input" name="fullName" required placeholder="Иванов Иван Иванович" />
              </label>
              <label className="cabinet-field">
                <span className="cabinet-field__label">Год выпуска</span>
                <input className="cabinet-field__input" name="year" type="number" required min={1950} max={2100} placeholder="2025" />
              </label>
              <label className="cabinet-field admin-user-form__full">
                <span className="cabinet-field__label">Специальность</span>
                <input className="cabinet-field__input" name="specialty" required placeholder="09.03.01 Информатика и вычислительная техника" />
              </label>
              <label className="cabinet-field admin-user-form__full">
                <span className="cabinet-field__label">Номер диплома</span>
                <input className="cabinet-field__input" name="diplomaNumber" required placeholder="ВСГ 1234567" />
              </label>
            </div>
            <div className="cabinet-actions" style={{ marginTop: "0.85rem" }}>
              <button type="submit" className="btn btn--primary" disabled={busy}>
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">Подписать</span>
              </button>
            </div>
          </form>
        </div>

        <div className="cabinet-card admin-form-card">
          <h3 className="cabinet-card__title">Массовая загрузка</h3>
          <p className="cabinet-card__hint" style={{ marginBottom: "0.85rem" }}>
            Загрузите файл, затем подпишите все записи одним приватным ключом КЭП.
          </p>
          <p className="cabinet-card__hint" style={{ marginBottom: "0.75rem" }}>
            Шаблон на 5 дипломов:{" "}
            <a href="/demo-keys/diplomas_bulk_5.csv" download>
              скачать CSV
            </a>
          </p>
          <label className="cabinet-field">
            <span className="cabinet-field__label">Файл</span>
            <input
              className="cabinet-field__input"
              type="file"
              accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={onBulkFileChange}
              disabled={busy}
            />
          </label>
          {bulkMessage ? (
            <p className="cabinet-card__hint" style={{ marginTop: "0.65rem", color: "rgba(0, 242, 255, 0.85)" }}>
              {bulkMessage}
            </p>
          ) : null}
          {bulkPreview.errors.length > 0 ? (
            <ul className="cabinet-bulk-errors" role="alert">
              {bulkPreview.errors.slice(0, 12).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {bulkPreview.errors.length > 12 ? <li>… и ещё {bulkPreview.errors.length - 12} сообщений</li> : null}
            </ul>
          ) : null}
          <div className="cabinet-actions" style={{ marginTop: "0.85rem" }}>
            <button type="button" className="btn btn--primary" disabled={busy || bulkPreview.rows.length === 0} onClick={onOpenBulkModal}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">Импортировать{bulkPreview.rows.length ? ` (${bulkPreview.rows.length})` : ""}</span>
            </button>
          </div>
        </div>
      </div>

      <h2 className="cabinet-section-title">Поиск по номеру диплома</h2>
      <p className="cabinet-section-lead">
        Введите номер так, как он указан в реестре. Поиск выполняется строго с учётом регистра.
      </p>
      <div className="cabinet-card admin-form-card" style={{ marginTop: "0.75rem" }}>
        <h3 className="cabinet-card__title">Найти и аннулировать</h3>
        <div className="cabinet-diploma-search-row" style={{ marginTop: "0.65rem" }}>
          <label className="cabinet-field cabinet-field--grow">
            <span className="cabinet-field__label">Номер диплома</span>
            <input
              className="cabinet-field__input"
              type="search"
              value={annulDiplomaNumber}
              onChange={(e) => {
                setAnnulDiplomaNumber(e.target.value);
                setAnnulFeedback(null);
              }}
              placeholder="Например: ВСГ 1234567"
              autoComplete="off"
              disabled={busy}
            />
          </label>
          <button type="button" className="btn btn--secondary cabinet-annul-btn" disabled={busy} onClick={onAnnulDiploma}>
            <span className="btn__label">Аннулировать</span>
          </button>
        </div>
        {annulFeedback ? (
          <p
            className="cabinet-card__hint"
            style={{
              marginTop: "0.65rem",
              marginBottom: 0,
              color: annulFeedback.type === "ok" ? "rgba(0, 242, 255, 0.88)" : "rgba(255, 201, 212, 0.95)",
            }}
            role={annulFeedback.type === "err" ? "alert" : "status"}
          >
            {annulFeedback.text}
          </p>
        ) : null}
      </div>

      {bulkModalOpen ? (
        <div className="cabinet-bulk-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-sign-title">
          <div className="cabinet-bulk-modal__panel">
            <h3 id="bulk-sign-title" className="cabinet-card__title" style={{ fontSize: "1rem" }}>
              Проверка перед массовой подписью
            </h3>
            <p className="cabinet-card__hint">Ниже все записи из файла. После подписи они будут добавлены в БД.</p>

            <div className="cabinet-bulk-table-wrap">
              <table className="cabinet-table cabinet-table--admin">
                <thead>
                  <tr>
                    <th scope="col">ФИО</th>
                    <th scope="col">Год</th>
                    <th scope="col">Специальность</th>
                    <th scope="col">Номер диплома</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPreview.rows.map((row, i) => (
                    <tr key={`${row.diplomaNumber}-${i}`}>
                      <td>{row.fullName}</td>
                      <td>{row.year}</td>
                      <td>{row.specialty}</td>
                      <td>{row.diplomaNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="cabinet-field" style={{ marginTop: "0.95rem" }}>
              <span className="cabinet-field__label">Приватный ключ КЭП</span>
              <input
                className="cabinet-field__input"
                type="file"
                accept=".pem,.key,.txt,application/x-pem-file,text/plain"
                onChange={onBulkPrivateKeyChange}
                disabled={busy}
              />
            </label>

            <p
              className={`auth-error${bulkSignError ? " is-visible" : ""}`}
              role={bulkSignError ? "alert" : undefined}
              aria-live="polite"
              aria-hidden={!bulkSignError}
              style={{ marginTop: "1.25rem" }}
            >
              {bulkSignError ?? ""}
            </p>

            <div className="cabinet-actions" style={{ marginTop: "0.95rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn--secondary" disabled={busy} onClick={onCloseBulkModal}>
                <span className="btn__label">Отмена</span>
              </button>
              <button type="button" className="btn btn--primary" disabled={busy || !bulkKeyLoaded} onClick={onBulkSignAndUpload}>
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">{busy ? "Подписание…" : "Подписать"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CabinetShell>
  );
}
