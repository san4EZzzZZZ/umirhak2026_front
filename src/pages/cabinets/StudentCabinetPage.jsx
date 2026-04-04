import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import * as studentDiplomaApi from "../../api/studentDiplomaApi.js";
import * as universityRegistryApi from "../../api/universityRegistryApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import { DGTU_SFU_BRANCH_NAMES } from "../../data/dgtuSfuBranches.js";
import { ISLOD_VPO_UNIVERSITY_NAMES } from "../../data/islodVpoUniversities.js";
import { MGU_BRANCH_NAMES } from "../../data/mguBranches.js";
import { ROSTGMU_NAMES } from "../../data/rostgmuBranches.js";
import { RGUPS_NAMES } from "../../data/rgupsBranches.js";
import { RINH_NAMES } from "../../data/rinhBranches.js";
import "./cabinet.css";

/** Демо-реестр + ВПО (ISLOD) + филиалы ДГТУ/ЮФУ + МГУ + РостГМУ + РГУПС + РИНХ; пересборка ISLOD: node scripts/fetch_islod_vpo_universities.mjs */
const DIPLOMA_SEARCH_VUZ_OPTIONS = [
  ...new Set([
    "Демо-университет",
    ...ISLOD_VPO_UNIVERSITY_NAMES,
    ...DGTU_SFU_BRANCH_NAMES,
    ...MGU_BRANCH_NAMES,
    ...ROSTGMU_NAMES,
    ...RGUPS_NAMES,
    ...RINH_NAMES,
  ]),
].sort((a, b) => a.localeCompare(b, "ru"));

/** Макс. строк в выпадающем списке (защита от подвисаний при огромных выборках). */
const VUZ_COMBO_MAX_VISIBLE = 3000;

const GRADUATION_SEARCH_YEAR_MAX = new Date().getFullYear();
const GRADUATION_SEARCH_YEAR_MIN = 1985;

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
  const [registryDiplomas, setRegistryDiplomas] = useState([]);
  const [diplomaSearchResults, setDiplomaSearchResults] = useState([]);
  const [diplomaSearchMessage, setDiplomaSearchMessage] = useState(null);
  const [diplomaSearchError, setDiplomaSearchError] = useState(null);
  const [diplomaSearchBusy, setDiplomaSearchBusy] = useState(false);
  const [gradYearInput, setGradYearInput] = useState("");
  const [vuzInput, setVuzInput] = useState("");
  const [vuzOpen, setVuzOpen] = useState(false);
  const [vuzHighlight, setVuzHighlight] = useState(-1);
  const vuzComboboxRef = useRef(null);
  const vuzListRef = useRef(null);

  const { vuzOptionsVisible, vuzOptionsTruncated } = useMemo(() => {
    const q = vuzInput.trim().toLowerCase();
    const all =
      q.length === 0
        ? DIPLOMA_SEARCH_VUZ_OPTIONS
        : DIPLOMA_SEARCH_VUZ_OPTIONS.filter((n) => n.toLowerCase().includes(q));
    if (all.length <= VUZ_COMBO_MAX_VISIBLE) {
      return { vuzOptionsVisible: all, vuzOptionsTruncated: false };
    }
    return {
      vuzOptionsVisible: all.slice(0, VUZ_COMBO_MAX_VISIBLE),
      vuzOptionsTruncated: true,
    };
  }, [vuzInput]);

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
    let cancelled = false;
    (async () => {
      const list = await universityRegistryApi.listDiplomaRecords();
      if (!cancelled) setRegistryDiplomas(list);
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

  useEffect(() => {
    setVuzHighlight(-1);
  }, [vuzInput]);

  useEffect(() => {
    if (!vuzOpen) return undefined;
    const onDocDown = (e) => {
      if (vuzComboboxRef.current && !vuzComboboxRef.current.contains(e.target)) {
        setVuzOpen(false);
        setVuzHighlight(-1);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [vuzOpen]);

  useEffect(() => {
    if (!vuzOpen || vuzHighlight < 0 || !vuzListRef.current) return;
    const ul = vuzListRef.current;
    const li = ul.children[vuzHighlight];
    const btn = li?.querySelector?.("button");
    btn?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [vuzHighlight, vuzOpen]);

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

  const onDiplomaSearch = async (e) => {
    e.preventDefault();
    setDiplomaSearchError(null);
    setDiplomaSearchMessage(null);
    const fd = new FormData(e.currentTarget);
    const diplomaNumber = fd.get("searchDiplomaNumber")?.toString() ?? "";
    const universityName = fd.get("searchUniversity")?.toString() ?? "";
    const graduationDate = gradYearInput.trim();
    if (graduationDate.length > 0) {
      if (graduationDate.length !== 4) {
        setDiplomaSearchError("Дата окончания: укажите полный четырёхзначный год (например, 2025).");
        setDiplomaSearchResults([]);
        return;
      }
      const y = Number(graduationDate);
      if (y < GRADUATION_SEARCH_YEAR_MIN || y > GRADUATION_SEARCH_YEAR_MAX) {
        setDiplomaSearchError(
          `Год окончания: допустимы значения ${GRADUATION_SEARCH_YEAR_MIN}–${GRADUATION_SEARCH_YEAR_MAX}.`,
        );
        setDiplomaSearchResults([]);
        return;
      }
    }
    if (!diplomaNumber.trim() && !universityName.trim() && !graduationDate) {
      setDiplomaSearchError("Укажите хотя бы один критерий поиска.");
      setDiplomaSearchResults([]);
      return;
    }
    setDiplomaSearchBusy(true);
    try {
      const rows = await universityRegistryApi.searchDiplomaRecords({
        diplomaNumber,
        universityName,
        graduationDate,
      });
      setDiplomaSearchResults(rows);
      setDiplomaSearchMessage(`Найдено записей: ${rows.length}`);
    } finally {
      setDiplomaSearchBusy(false);
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

  /** Не даём колесу «уезжать» на страницу, пока в списке ещё есть куда скроллить. */
  const onVuzListWheel = (e) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) return;
    const dy = e.deltaY;
    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 2;
    if ((dy < 0 && atTop) || (dy > 0 && atBottom)) return;
    e.stopPropagation();
  };

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

      <div
        className={`cabinet-card admin-form-card${vuzOpen ? " admin-form-card--vuz-dropdown-active" : ""}`}
        style={{ marginTop: "1rem" }}
      >
        <h2 className="cabinet-card__title">Поиск диплома</h2>
        {diplomaSearchError ? (
          <p className="auth-error" role="alert">
            {diplomaSearchError}
          </p>
        ) : null}
        <form className="admin-user-form" onSubmit={onDiplomaSearch}>
          <div className="admin-user-form__grid">
            <label className="cabinet-field admin-user-form__full">
              <span className="cabinet-field__label">Номер диплома</span>
              <input
                className="cabinet-field__input"
                name="searchDiplomaNumber"
                list="student-diploma-search-number-suggestions"
                autoComplete="off"
                placeholder="ВСГ 1234567 или выберите из списка"
              />
            </label>
            <label className="cabinet-field admin-user-form__full">
              <span className="cabinet-field__label" id="student-vuz-combobox-label">
                Название вуза
              </span>
              <div className="student-vuz-combobox" ref={vuzComboboxRef}>
                <div className="student-vuz-combobox__wrap">
                  <input
                    className="cabinet-field__input student-vuz-combobox__input"
                    name="searchUniversity"
                    id="student-vuz-combobox-input"
                    autoComplete="off"
                    placeholder="Введите название — появятся подсказки из списка ВПО"
                    aria-autocomplete="list"
                    aria-expanded={vuzOpen}
                    aria-controls="student-vuz-combobox-list"
                    aria-labelledby="student-vuz-combobox-label"
                    role="combobox"
                    title="Подсказки: стрелки ↑↓ — листать по кругу, Enter — выбрать, Esc — закрыть, PgUp/PgDn, Home/End"
                    value={vuzInput}
                    onChange={(e) => {
                      setVuzInput(e.target.value);
                      setVuzOpen(true);
                    }}
                    onFocus={() => setVuzOpen(true)}
                    onKeyDown={(e) => {
                      const len = vuzOptionsVisible.length;
                      const pageStep = 12;

                      if (e.key === "ArrowDown") {
                        if (len === 0) return;
                        e.preventDefault();
                        setVuzOpen(true);
                        setVuzHighlight((h) => {
                          if (h < 0) return 0;
                          return h >= len - 1 ? 0 : h + 1;
                        });
                      } else if (e.key === "ArrowUp") {
                        if (len === 0) return;
                        e.preventDefault();
                        setVuzOpen(true);
                        setVuzHighlight((h) => {
                          if (h <= 0) return len - 1;
                          return h - 1;
                        });
                      } else if (e.key === "PageDown" && len > 0) {
                        e.preventDefault();
                        setVuzOpen(true);
                        setVuzHighlight((h) => {
                          const cur = h < 0 ? 0 : h;
                          return Math.min(len - 1, cur + pageStep);
                        });
                      } else if (e.key === "PageUp" && len > 0) {
                        e.preventDefault();
                        setVuzOpen(true);
                        setVuzHighlight((h) => {
                          const cur = h < 0 ? len - 1 : h;
                          return Math.max(0, cur - pageStep);
                        });
                      } else if (e.key === "Home" && len > 0 && vuzOpen) {
                        e.preventDefault();
                        setVuzHighlight(0);
                      } else if (e.key === "End" && len > 0 && vuzOpen) {
                        e.preventDefault();
                        setVuzHighlight(len - 1);
                      } else if (e.key === "Enter" && vuzOpen && vuzHighlight >= 0 && vuzOptionsVisible[vuzHighlight]) {
                        e.preventDefault();
                        setVuzInput(vuzOptionsVisible[vuzHighlight]);
                        setVuzOpen(false);
                        setVuzHighlight(-1);
                      } else if (e.key === "Escape" && vuzOpen) {
                        e.preventDefault();
                        setVuzOpen(false);
                        setVuzHighlight(-1);
                      }
                    }}
                  />
                  {vuzOpen ? (
                    <div
                      className="student-vuz-combobox__panel"
                      id="student-vuz-combobox-list"
                      role="listbox"
                      aria-label="Подсказки: названия вузов"
                    >
                      {vuzOptionsVisible.length > 0 ? (
                        <ul
                          className="student-vuz-combobox__list"
                          ref={vuzListRef}
                          onWheel={onVuzListWheel}
                        >
                          {vuzOptionsVisible.map((name, i) => (
                            <li key={`${name}-${i}`}>
                              <button
                                type="button"
                                className={`student-vuz-combobox__option${i === vuzHighlight ? " student-vuz-combobox__option--active" : ""}`}
                                role="option"
                                aria-selected={i === vuzHighlight}
                                onMouseEnter={() => setVuzHighlight(i)}
                                onMouseDown={(ev) => {
                                  ev.preventDefault();
                                  setVuzInput(name);
                                  setVuzOpen(false);
                                  setVuzHighlight(-1);
                                }}
                              >
                                {name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {vuzOptionsTruncated ? (
                        <p className="student-vuz-combobox__trunc">
                          Показаны первые {VUZ_COMBO_MAX_VISIBLE} совпадений — уточните название.
                        </p>
                      ) : null}
                      {vuzOptionsVisible.length === 0 && vuzInput.trim().length > 0 ? (
                        <p className="student-vuz-combobox__empty">
                          Нет совпадений в списке ВПО — поиск выполнится по введённому тексту.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </label>
            <label className="cabinet-field admin-user-form__full">
              <span className="cabinet-field__label" id="grad-year-label">
                Дата окончания
              </span>
              <input
                className="cabinet-field__input cabinet-field__input--year"
                type="number"
                name="searchGraduationDate"
                id="grad-year-input"
                inputMode="numeric"
                autoComplete="off"
                min={GRADUATION_SEARCH_YEAR_MIN}
                max={GRADUATION_SEARCH_YEAR_MAX}
                step={1}
                placeholder={`${GRADUATION_SEARCH_YEAR_MIN}–${GRADUATION_SEARCH_YEAR_MAX}`}
                aria-labelledby="grad-year-label"
                title={`Год ${GRADUATION_SEARCH_YEAR_MIN}–${GRADUATION_SEARCH_YEAR_MAX}. Стрелки меняют год, ввод — не более 4 цифр.`}
                value={gradYearInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setGradYearInput("");
                    return;
                  }
                  const digits = raw.replace(/\D/g, "").slice(0, 4);
                  setGradYearInput(digits);
                }}
                onKeyDown={(e) => {
                  if (["e", "E", "+", "-", "."].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onBlur={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (digits.length !== 4) return;
                  const n = Number(digits);
                  if (Number.isNaN(n)) return;
                  const c = Math.min(
                    GRADUATION_SEARCH_YEAR_MAX,
                    Math.max(GRADUATION_SEARCH_YEAR_MIN, n),
                  );
                  setGradYearInput(String(c));
                }}
              />
            </label>
          </div>
          <datalist id="student-diploma-search-number-suggestions">
            {registryDiplomas.map((d) => (
              <option key={d.id} value={d.diplomaNumber} />
            ))}
          </datalist>
          <div className="cabinet-actions" style={{ marginTop: "0.85rem" }}>
            <button type="submit" className="btn btn--primary" disabled={diplomaSearchBusy}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">{diplomaSearchBusy ? "Поиск…" : "Найти"}</span>
            </button>
          </div>
        </form>
        {diplomaSearchMessage ? (
          <p className="cabinet-card__hint" style={{ marginTop: "0.65rem", color: "rgba(0, 242, 255, 0.85)" }}>
            {diplomaSearchMessage}
          </p>
        ) : null}
        {diplomaSearchResults.length > 0 ? (
          <div className="cabinet-table-wrap" style={{ marginTop: "1rem" }}>
            <table className="cabinet-table cabinet-table--admin">
              <thead>
                <tr>
                  <th scope="col">ФИО</th>
                  <th scope="col">Год</th>
                  <th scope="col">Специальность</th>
                  <th scope="col">Номер диплома</th>
                  <th scope="col">Вуз</th>
                </tr>
              </thead>
              <tbody>
                {diplomaSearchResults.map((d) => (
                  <tr key={d.id}>
                    <td>{d.fullName}</td>
                    <td>{d.year}</td>
                    <td>{d.specialty}</td>
                    <td>{d.diplomaNumber}</td>
                    <td>{d.universityName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
