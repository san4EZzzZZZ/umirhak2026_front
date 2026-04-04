import { useEffect, useState } from "react";
import QRCode from "qrcode";
import * as studentDiplomaApi from "../../api/studentDiplomaApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

function formatRemaining(ms) {
  if (ms <= 0) return "истекло";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} ч ${m} мин ${sec} с`;
  if (m > 0) return `${m} мин ${sec} с`;
  return `${sec} с`;
}

const TTL_OPTIONS = [
  { value: 24, label: "24 часа" },
  { value: 72, label: "3 суток (72 ч)" },
  { value: 168, label: "7 суток (168 ч)" },
];

/** Kotlin: studentDiplomaApi.js */
export default function StudentCabinetPage() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchMessage, setSearchMessage] = useState(null);
  const [ttlHours, setTtlHours] = useState(72);
  const [issued, setIssued] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [copyHint, setCopyHint] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await studentDiplomaApi.getMyDiplomaRecord();
        if (!cancelled) setRecord(r);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!issued?.url) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(issued.url, {
      width: 220,
      margin: 2,
      color: { dark: "#0a0a24ff", light: "#ffffffff" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [issued?.url]);

  useEffect(() => {
    if (!issued?.expiresAt) return undefined;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [issued?.expiresAt]);

  const onSearch = async (e) => {
    e.preventDefault();
    setSearchMessage(null);
    setSearchBusy(true);
    try {
      const res = await studentDiplomaApi.findSelfInRegistry(searchQuery);
      if (res.found) {
        setRecord(res.record);
        setSearchMessage({ type: "ok", text: "Запись найдена в реестре и отображена ниже." });
      } else if (res.reason === "empty") {
        setSearchMessage({ type: "err", text: "Введите номер диплома или ФИО." });
      } else {
        setSearchMessage({
          type: "err",
          text: "Запись не найдена. Проверьте номер диплома или написание ФИО.",
        });
      }
    } finally {
      setSearchBusy(false);
    }
  };

  const shareWithEmployer = async () => {
    setShareBusy(true);
    setCopyHint("");
    try {
      const res = await studentDiplomaApi.issueVerificationLink({ ttlHours });
      setIssued({
        token: res.token,
        url: res.verificationUrl,
        ttlHours: res.ttlHours,
        issuedAt: res.issuedAt,
        expiresAt: res.expiresAt,
      });
      setNowTick(Date.now());
    } finally {
      setShareBusy(false);
    }
  };

  const copyLink = async () => {
    if (!issued?.url) return;
    try {
      await navigator.clipboard.writeText(issued.url);
      setCopyHint("Ссылка скопирована");
      setTimeout(() => setCopyHint(""), 2500);
    } catch {
      setCopyHint("Не удалось скопировать — выделите ссылку вручную");
    }
  };

  const remainingMs = issued?.expiresAt ? new Date(issued.expiresAt).getTime() - nowTick : 0;
  const linkExpired = issued && remainingMs <= 0;

  return (
    <CabinetShell
      badge="Личный кабинет студента"
      title="Проверка диплома для работодателя"
      subtitle="Найдите свою запись, выпустите временную ссылку и QR-код — доступ для HR ограничен по времени в целях безопасности."
    >
      <div className="student-cabinet-hero">
        <p className="student-cabinet-hero__title">Возможности кабинета</p>
        <ul className="student-cabinet-hero__list">
          <li>
            <span className="student-cabinet-hero__icon" aria-hidden="true">
              +
            </span>
            <span>Поиск себя: ввод номера диплома или ФИО</span>
          </li>
          <li>
            <span className="student-cabinet-hero__icon" aria-hidden="true">
              +
            </span>
            <span>Генерация ссылки: кнопка «Поделиться с работодателем»</span>
          </li>
          <li>
            <span className="student-cabinet-hero__icon" aria-hidden="true">
              +
            </span>
            <span>QR-код: уникальный код для бумажного или цифрового резюме</span>
          </li>
          <li>
            <span className="student-cabinet-hero__icon" aria-hidden="true">
              +
            </span>
            <span>Временный доступ: ссылка действует ограниченное время</span>
          </li>
        </ul>
      </div>

      <div className="cabinet-card student-cabinet-search" style={{ marginTop: "1rem" }}>
        <h2 className="cabinet-card__title">Поиск себя в реестре</h2>
        <p className="cabinet-card__hint" style={{ marginBottom: "0.75rem" }}>
          Введите номер диплома или ФИО так, как они указаны в документе — мы найдём вашу запись в демо-реестре.
        </p>
        <form className="student-cabinet-search__form" onSubmit={onSearch}>
          <label className="cabinet-field" style={{ marginBottom: 0, flex: "1 1 220px" }}>
            <span className="cabinet-field__label">Номер диплома или ФИО</span>
            <input
              className="cabinet-field__input"
              name="registrySearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Например: ДБ-2025-004921 или Петрова Анна"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn btn--secondary student-cabinet-search__btn" disabled={searchBusy}>
            {searchBusy ? "Поиск…" : "Найти"}
          </button>
        </form>
        {searchMessage ? (
          <p
            className={
              searchMessage.type === "ok" ? "student-cabinet-search__ok" : "student-cabinet-search__err"
            }
            role="status"
          >
            {searchMessage.text}
          </p>
        ) : null}
      </div>

      <div className="cabinet-grid cabinet-grid--2" style={{ marginTop: "1rem" }}>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Статус записи</h2>
          {loading || !record ? (
            <p className="cabinet-card__hint">Загрузка… (Kotlin: GET /api/v1/student/me/diploma-record)</p>
          ) : (
            <>
              <p className="cabinet-card__meta" style={{ fontSize: "1rem", fontWeight: 600 }}>
                {record.status === "CONFIRMED" ? "Подтверждена в реестре" : record.status}
              </p>
              <p className="cabinet-card__hint">
                ВУЗ: {record.universityName} · выпуск {record.graduationYear} · {record.program}
              </p>
              {record.holderFullName ? (
                <p className="cabinet-card__hint">ФИО в реестре: {record.holderFullName}</p>
              ) : null}
            </>
          )}
        </div>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Документ</h2>
          {loading || !record ? (
            <p className="cabinet-card__hint">…</p>
          ) : (
            <>
              <p className="cabinet-card__meta" style={{ fontSize: "1rem", fontWeight: 600 }}>
                {record.documentType}
              </p>
              {record.diplomaNumber ? (
                <p className="cabinet-card__hint">Регистрационный номер: {record.diplomaNumber}</p>
              ) : (
                <p className="cabinet-card__hint">
                  Серия и номер скрыты; полные реквизиты доступны при проверке по выданной вами ссылке
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="cabinet-card student-cabinet-share" style={{ marginTop: "1rem" }}>
        <h2 className="cabinet-card__title">Поделиться с работодателем</h2>
        <p className="cabinet-card__hint" style={{ marginBottom: "0.85rem" }}>
          Ссылка одноразово подтверждает подлинность в рамках выбранного срока (TTL). После истечения времени проверка по
          старой ссылке недоступна — выпустите новую. Kotlin: POST /api/v1/student/verification-links
        </p>
        <div className="cabinet-field" style={{ maxWidth: "280px" }}>
          <span className="cabinet-field__label" id="ttl-label">
            Срок действия ссылки
          </span>
          <select
            className="cabinet-field__input"
            id="ttl-select"
            aria-labelledby="ttl-label"
            value={ttlHours}
            onChange={(e) => setTtlHours(Number(e.target.value))}
          >
            {TTL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="cabinet-actions" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={shareWithEmployer}
            disabled={shareBusy || loading}
          >
            <span className="btn__shine" aria-hidden="true" />
            <span className="btn__label">Поделиться с работодателем</span>
          </button>
        </div>

        {issued ? (
          <div className="student-cabinet-issued">
            <div className="student-cabinet-issued__row">
              <div className="student-cabinet-issued__link-block">
                <p className="student-cabinet-issued__label">Временная ссылка</p>
                <div className="cabinet-mock student-cabinet-issued__url" role="status">
                  {issued.url}
                </div>
                <div className="student-cabinet-issued__meta">
                  <span>Выдано: {new Date(issued.issuedAt).toLocaleString("ru-RU")}</span>
                  <span>TTL: {issued.ttlHours} ч</span>
                </div>
                <div
                  className={`student-cabinet-countdown${linkExpired ? " student-cabinet-countdown--expired" : ""}${remainingMs > 0 && remainingMs < 3600000 ? " student-cabinet-countdown--soon" : ""}`}
                  role="timer"
                  aria-live="polite"
                >
                  {linkExpired
                    ? "Срок действия ссылки истёк — сгенерируйте новую."
                    : `Осталось: ${formatRemaining(remainingMs)}`}
                </div>
                <button type="button" className="btn btn--secondary student-cabinet-copy" onClick={() => void copyLink()}>
                  Копировать ссылку
                </button>
                {copyHint ? (
                  <span className="student-cabinet-copy-hint" role="status">
                    {copyHint}
                  </span>
                ) : null}
              </div>
              <div className="student-cabinet-qr">
                <p className="student-cabinet-issued__label">QR-код для резюме</p>
                <p className="cabinet-card__hint" style={{ marginTop: 0, marginBottom: "0.5rem" }}>
                  Уникальный код ведёт на ту же временную ссылку — можно вшить в печатное резюме или приложить к PDF.
                </p>
                {qrDataUrl ? (
                  <>
                    <div className="student-cabinet-qr__frame">
                      <img src={qrDataUrl} width={220} height={220} alt="QR-код проверки диплома" />
                    </div>
                    <a className="btn btn--secondary student-cabinet-qr__dl" href={qrDataUrl} download="diploma-verify-qr.png">
                      Скачать QR (PNG)
                    </a>
                  </>
                ) : (
                  <p className="cabinet-card__hint">Формирование QR…</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="cabinet-card__hint" style={{ marginTop: "0.75rem" }}>
            Нажмите кнопку выше, чтобы получить ссылку и QR. В демо ответ формируется на фронте; после подключения
            Kotlin-бэкенда здесь будут реальный токен и политика отзыва.
          </p>
        )}
      </div>
    </CabinetShell>
  );
}
