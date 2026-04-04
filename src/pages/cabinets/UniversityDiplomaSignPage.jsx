import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as universityRegistryApi from "../../api/universityRegistryApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

const SIGN_ALGO = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };

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

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function normalizePem(text) {
  return String(text ?? "").replace(/\r/g, "").trim();
}

function extractPemBody(pem, beginMarker, endMarker) {
  const normalized = normalizePem(pem);
  if (!normalized.includes(beginMarker) || !normalized.includes(endMarker)) {
    return "";
  }
  return normalized.replace(beginMarker, "").replace(endMarker, "").replace(/\s+/g, "");
}

function buildSigningPayload(draft) {
  const canonical = [
    String(draft.fullName ?? "").trim(),
    String(draft.specialty ?? "").trim(),
    String(draft.diplomaNumber ?? "").trim().toUpperCase(),
    String(Number(draft.year)),
  ].join("|");
  return new TextEncoder().encode(canonical);
}

function jwkToPemPublic(jwk) {
  const spki = {
    kty: "RSA",
    n: jwk.n,
    e: jwk.e,
    alg: "RS256",
    ext: true,
    key_ops: ["verify"],
  };
  return crypto.subtle.importKey("jwk", spki, SIGN_ALGO, true, ["verify"]).then((publicKey) =>
    crypto.subtle.exportKey("spki", publicKey).then((spkiDer) => {
      const b64 = arrayBufferToBase64(spkiDer);
      const chunks = b64.match(/.{1,64}/g) ?? [];
      return `-----BEGIN PUBLIC KEY-----\n${chunks.join("\n")}\n-----END PUBLIC KEY-----`;
    })
  );
}

export default function UniversityDiplomaSignPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = location.state?.draft;

  const [privateKeyHash, setPrivateKeyHash] = useState("");
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKeyPem, setPublicKeyPem] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isValidDraft(draft)) {
      navigate("/cabinet/vuz", { replace: true });
    }
  }, [draft, navigate]);

  const keyLoaded = useMemo(() => Boolean(privateKey && privateKeyHash && publicKeyPem), [privateKey, privateKeyHash, publicKeyPem]);

  const onPrivateKeyChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPrivateKeyHash("");
      setPrivateKey(null);
      setPublicKeyPem("");
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
      setPrivateKeyHash(toHex(digest));
      setPrivateKey(importedPrivateKey);
      setPublicKeyPem(exportedPublicPem);
      setError(null);
    } catch (err) {
      event.target.value = "";
      setPrivateKeyHash("");
      setPrivateKey(null);
      setPublicKeyPem("");
      setError(err instanceof Error ? err.message : "Не удалось загрузить приватный ключ.");
    }
  }, []);

  const onSignAndCommit = useCallback(async () => {
    if (!isValidDraft(draft)) return;
    if (!privateKey) {
      setError("Ключ не выбран.");
      return;
    }
    if (!keyLoaded) {
      setError("Загрузите корректный приватный ключ КЭП.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const payload = buildSigningPayload(draft);
      const signature = await crypto.subtle.sign(SIGN_ALGO, privateKey, payload);
      const pkg = {
        fullName: draft.fullName.trim(),
        year: Number(draft.year),
        specialty: draft.specialty.trim(),
        diplomaNumber: draft.diplomaNumber.trim(),
        privateKeyHash,
        signatureBase64: arrayBufferToBase64(signature),
        publicKeyPem,
        signatureAlgorithm: "RSASSA-PKCS1-v1_5-SHA-256",
      };
      await universityRegistryApi.commitSignedDiplomaRecord(pkg);
      navigate("/cabinet/vuz", { replace: true, state: { capSignedOk: true } });
    } catch {
      setError("Не удалось подписать и сохранить запись.");
    } finally {
      setBusy(false);
    }
  }, [draft, keyLoaded, navigate, privateKey, privateKeyHash, publicKeyPem]);

  if (!isValidDraft(draft)) {
    return null;
  }

  return (
    <CabinetShell
      badge="Личный кабинет ВУЗа"
      title="Подпись КЭП"
      subtitle="Загрузите приватный ключ КЭП: диплом подписывается на клиенте, а бэкенд проверяет подпись публичным ключом."
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
          Выберите приватный ключ в формате PKCS#8 (`BEGIN PRIVATE KEY`). Публичный ключ не подходит.
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
        <p
          className={`auth-error${error ? " is-visible" : ""}`}
          role={error ? "alert" : undefined}
          aria-live="polite"
          aria-hidden={!error}
          style={{ marginTop: "1.25rem" }}
        >
          {error ?? ""}
        </p>

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
