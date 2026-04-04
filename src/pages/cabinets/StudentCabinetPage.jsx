import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import * as studentDiplomaApi from "../../api/studentDiplomaApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

const TTL_OPTIONS = [
  { value: 24, label: "24 часа" },
  { value: 72, label: "3 суток (72 ч)" },
  { value: 168, label: "7 суток (168 ч)" },
];

function formatDate(value) {
  return new Date(value).toLocaleString("ru-RU");
}

export default function StudentCabinetPage() {
  const [form, setForm] = useState({
    universityCode: "",
    diplomaNumber: "",
    graduationYear: "",
    specialty: "",
  });
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [checkError, setCheckError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const [ttlHours, setTtlHours] = useState(72);
  const [issueBusy, setIssueBusy] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [issueSuccess, setIssueSuccess] = useState("");
  const [linksBusy, setLinksBusy] = useState(false);
  const [links, setLinks] = useState([]);
  const [selectedToken, setSelectedToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copyHint, setCopyHint] = useState("");

  const selectedLink = useMemo(
    () => links.find((l) => l.token === selectedToken) ?? links.find((l) => l.status === "ACTIVE") ?? links[0] ?? null,
    [links, selectedToken]
  );

  const loadLinks = async () => {
    setLinksBusy(true);
    try {
      const data = await studentDiplomaApi.listStudentVerificationLinks();
      setLinks(data);
      if (!selectedToken && data.length > 0) {
        setSelectedToken(data[0].token);
      }
    } finally {
      setLinksBusy(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  useEffect(() => {
    if (!selectedLink?.verificationUrl) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(selectedLink.verificationUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#0a0a24ff", light: "#ffffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLink?.verificationUrl]);

  const onCheckDiploma = async (e) => {
    e.preventDefault();
    setCheckError("");
    setCheckResult(null);
    setIssueError("");
    setIssueSuccess("");
    setCurrentStep(1);
    if (!form.universityCode.trim() || !form.diplomaNumber.trim() || !form.graduationYear.trim() || !form.specialty.trim()) {
      setCheckError("Заполните все поля диплома.");
      return;
    }
    setCheckBusy(true);
    try {
      const result = await studentDiplomaApi.checkDiplomaForCurrentStudent({
        universityCode: form.universityCode,
        diplomaNumber: form.diplomaNumber,
        graduationYear: Number(form.graduationYear),
        specialty: form.specialty,
      });
      setCheckResult(result);
      setCurrentStep(2);
      if (!result.found) {
        setCheckError("Диплом не найден в реестре. Проверьте данные.");
      }
    } catch (error) {
      setCheckError(error instanceof Error ? error.message : "Ошибка проверки диплома.");
      setCurrentStep(2);
    } finally {
      setCheckBusy(false);
    }
  };

  const onIssueQr = async () => {
    if (!checkResult?.found) {
      setIssueError("Сначала подтвердите диплом.");
      return;
    }
    setIssueError("");
    setIssueSuccess("");
    setIssueBusy(true);
    try {
      const created = await studentDiplomaApi.createStudentVerificationLink({
        universityCode: form.universityCode,
        diplomaNumber: form.diplomaNumber,
        ttlHours,
      });
      await loadLinks();
      setSelectedToken(created.token);
      setIssueSuccess("QR успешно создан");
      setCurrentStep(3);
    } catch (error) {
      setIssueError(error instanceof Error ? error.message : "Не удалось создать QR.");
    } finally {
      setIssueBusy(false);
    }
  };

  const onRevoke = async (token) => {
    try {
      await studentDiplomaApi.revokeStudentVerificationLink(token);
      await loadLinks();
    } catch (error) {
      setIssueError(error instanceof Error ? error.message : "Не удалось деактивировать ссылку.");
    }
  };

  const copyLink = async () => {
    if (!selectedLink?.verificationUrl) return;
    try {
      await navigator.clipboard.writeText(selectedLink.verificationUrl);
      setCopyHint("Ссылка скопирована");
      setTimeout(() => setCopyHint(""), 2200);
    } catch {
      setCopyHint("Не удалось скопировать");
    }
  };

  const onResetFlow = () => {
    setForm({
      universityCode: "",
      diplomaNumber: "",
      graduationYear: "",
      specialty: "",
    });
    setCheckResult(null);
    setCheckError("");
    setIssueError("");
    setIssueSuccess("");
    setCurrentStep(1);
  };

  return (
    <CabinetShell
      badge="Личный кабинет студента"
      title="QR для проверки диплома"
      subtitle="Проверьте диплом в реестре, выпустите QR-ссылку с TTL и деактивируйте её в любой момент."
    >
      {currentStep === 1 ? (
      <div className="cabinet-card student-step-panel is-visible" style={{ marginTop: "0.6rem" }}>
        <h2 className="cabinet-card__title">Шаг 1. Данные диплома</h2>
        <p className="cabinet-card__hint">После проверки будут автоматически открыты следующие шаги.</p>
        <form className="admin-user-form" onSubmit={onCheckDiploma}>
          <div className="admin-user-form__grid" style={{ marginTop: "0.8rem" }}>
            <label className="cabinet-field">
              <span className="cabinet-field__label">Название ВУЗа</span>
              <input
                className="cabinet-field__input"
                value={form.universityCode}
                onChange={(e) => setForm((v) => ({ ...v, universityCode: e.target.value }))}
                placeholder="DEMO"
              />
            </label>
            <label className="cabinet-field">
              <span className="cabinet-field__label">Номер диплома</span>
              <input
                className="cabinet-field__input"
                value={form.diplomaNumber}
                onChange={(e) => setForm((v) => ({ ...v, diplomaNumber: e.target.value }))}
                placeholder="ВСГ 1234567"
              />
            </label>
            <label className="cabinet-field">
              <span className="cabinet-field__label">Год выпуска</span>
              <input
                className="cabinet-field__input"
                type="number"
                min={1950}
                max={2100}
                value={form.graduationYear}
                onChange={(e) => setForm((v) => ({ ...v, graduationYear: e.target.value }))}
                placeholder="2025"
              />
            </label>
            <label className="cabinet-field admin-user-form__full">
              <span className="cabinet-field__label">Специальность</span>
              <input
                className="cabinet-field__input"
                value={form.specialty}
                onChange={(e) => setForm((v) => ({ ...v, specialty: e.target.value }))}
                placeholder="09.03.01 Информатика и вычислительная техника"
              />
            </label>
          </div>
          {checkError ? (
            <p className="auth-error is-visible" role="alert" style={{ marginTop: "0.75rem" }}>
              {checkError}
            </p>
          ) : null}
          <div className="cabinet-actions" style={{ marginTop: "0.9rem" }}>
            <button type="submit" className="btn btn--primary" disabled={checkBusy}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">{checkBusy ? "Проверка…" : "Проверить диплом"}</span>
            </button>
          </div>
        </form>
      </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="cabinet-card student-step-panel is-visible" style={{ marginTop: "1rem" }}>
          <h2 className="cabinet-card__title">Шаг 2. Результат проверки</h2>
          {checkResult?.found ? (
            <div className="student-step-result student-step-result--ok" role="status">
              <span className="student-step-result__icon student-step-result__icon--ok" aria-hidden="true">
                ✓
              </span>
              <div>
                <p className="student-step-result__title">Диплом найден в реестре</p>
                <p className="cabinet-card__hint">Хэш совпал с базой дипломов. Можно переходить к QR.</p>
                <div className="cabinet-actions" style={{ marginTop: "0.75rem" }}>
                  <button type="button" className="btn btn--primary" onClick={() => setCurrentStep(3)}>
                    <span className="btn__shine" aria-hidden="true" />
                    <span className="btn__label">Далее</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="student-step-result student-step-result--fail">
              <span className="student-step-result__icon student-step-result__icon--fail" aria-hidden="true">
                ✕
              </span>
              <div>
                <p className="student-step-result__title">Диплом не подтверждён</p>
                <p className="cabinet-card__hint">Проверьте данные в шаге 1 и запустите проверку снова.</p>
                <div className="cabinet-actions" style={{ marginTop: "0.75rem" }}>
                  <button type="button" className="btn btn--secondary" onClick={onResetFlow}>
                    <span className="btn__label">Заполнить заново</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="cabinet-card student-step-panel is-visible" style={{ marginTop: "1rem" }}>
          <h2 className="cabinet-card__title">Шаг 3. Создание QR</h2>
          <div className="cabinet-field" style={{ maxWidth: "280px", marginTop: "0.75rem" }}>
            <span className="cabinet-field__label">Срок действия</span>
            <select className="cabinet-field__input" value={ttlHours} onChange={(e) => setTtlHours(Number(e.target.value))}>
              {TTL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {issueError ? (
            <p className="auth-error is-visible" role="alert" style={{ marginTop: "0.75rem" }}>
              {issueError}
            </p>
          ) : null}
          {issueSuccess ? (
            <p className="cabinet-cap-flash" role="status" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
              {issueSuccess}
            </p>
          ) : null}
          <div className="cabinet-actions" style={{ marginTop: "0.9rem" }}>
            <button type="button" className="btn btn--primary" disabled={!checkResult?.found || issueBusy} onClick={onIssueQr}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">{issueBusy ? "Создание…" : "Создать QR-ссылку"}</span>
            </button>
            <button type="button" className="btn btn--secondary" disabled={issueBusy} onClick={onResetFlow}>
              <span className="btn__label">Заполнить заново</span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="cabinet-grid cabinet-grid--2 student-step-panel is-visible" style={{ marginTop: "1rem" }}>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Созданные QR-ссылки</h2>
          {linksBusy ? <p className="cabinet-card__hint">Загрузка…</p> : null}
          {!linksBusy && links.length === 0 ? <p className="cabinet-card__hint">Ссылок пока нет.</p> : null}
          <div className="student-links-list">
            {links.map((link) => (
              <div
                key={link.token}
                className={`student-link-card${selectedLink?.token === link.token ? " is-active" : ""}`}
                onClick={() => setSelectedToken(link.token)}
              >
                <p className="student-link-card__status">{link.status}</p>
                <p className="student-link-card__meta">Выдано: {formatDate(link.issuedAt)}</p>
                <p className="student-link-card__meta">Истекает: {formatDate(link.expiresAt)}</p>
                {link.status === "ACTIVE" ? (
                  <button
                    type="button"
                    className="btn btn--secondary student-link-card__revoke"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevoke(link.token);
                    }}
                  >
                    Деактивировать
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="cabinet-card">
          <h2 className="cabinet-card__title">QR-код</h2>
          {!selectedLink ? (
            <p className="cabinet-card__hint">Выберите или создайте ссылку.</p>
          ) : (
            <>
              <div className="cabinet-mock student-cabinet-issued__url">{selectedLink.verificationUrl}</div>
              <div className="cabinet-actions" style={{ marginTop: "0.7rem" }}>
                <button type="button" className="btn btn--secondary" onClick={() => void copyLink()}>
                  Копировать ссылку
                </button>
              </div>
              {copyHint ? (
                <p className="cabinet-card__hint" role="status">
                  {copyHint}
                </p>
              ) : null}
              {qrDataUrl ? (
                <div className="student-cabinet-qr__styled">
                  <div className="student-cabinet-qr__frame">
                    <img src={qrDataUrl} width={240} height={240} alt="QR-код проверки диплома" />
                  </div>
                  <a className="btn btn--secondary student-cabinet-qr__dl" href={qrDataUrl} download="student-diploma-qr.png">
                    Скачать QR (PNG)
                  </a>
                </div>
              ) : (
                <p className="cabinet-card__hint">Формирование QR…</p>
              )}
            </>
          )}
        </div>
      </div>
    </CabinetShell>
  );
}
