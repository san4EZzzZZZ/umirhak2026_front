import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as universityRegistryApi from "../../api/universityRegistryApi.js";
import { parseDiplomaImportFile } from "../../utils/parseDiplomaImport.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

/** Данные с Kotlin-бэкенда: см. universityRegistryApi.js */

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

  const onAnnulDiploma = async () => {
    const n = annulDiplomaNumber.trim();
    setAnnulFeedback(null);
    if (!n) {
      setAnnulFeedback({ type: "err", text: "Введите номер диплома." });
      return;
    }
    if (!window.confirm(`Аннулировать диплом «${n}»? В демо запись будет удалена из списка загруженных.`)) {
      return;
    }
    setBusy(true);
    try {
      const { removed } = await universityRegistryApi.annulDiplomaByNumber(n);
      if (!removed) {
        setAnnulFeedback({ type: "err", text: "Запись с таким номером не найдена." });
      } else {
        setAnnulFeedback({ type: "ok", text: `Диплом «${n}» аннулирован.` });
        setAnnulDiplomaNumber("");
      }
    } catch {
      setAnnulFeedback({ type: "err", text: "Не удалось выполнить операцию." });
    } finally {
      setBusy(false);
    }
  };

  const onBulkImport = async () => {
    if (bulkPreview.rows.length === 0) return;
    setBusy(true);
    setBulkMessage(null);
    try {
      const { added } = await universityRegistryApi.addDiplomaRecordsBulk(bulkPreview.rows);
      setBulkPreview({ rows: [], errors: [] });
      setBulkMessage(`Импортировано записей: ${added}`);
    } catch {
      setBulkMessage("Ошибка импорта.");
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
            После заполнения откроется шаг подписи КЭП (демо-ключ в браузере), затем запись сохранится в реестре. Массовый импорт — без КЭП.
          </p>
          {diplomaFormError ? (
            <p className="auth-error" role="alert">
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
                <input
                  className="cabinet-field__input"
                  name="year"
                  type="number"
                  required
                  min={1950}
                  max={2100}
                  placeholder="2025"
                />
              </label>
              <label className="cabinet-field admin-user-form__full">
                <span className="cabinet-field__label">Специальность</span>
                <input
                  className="cabinet-field__input"
                  name="specialty"
                  required
                  placeholder="09.03.01 Информатика и вычислительная техника"
                />
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
            Файл <strong>.csv</strong> (разделитель запятая или точка с запятой) или <strong>.xlsx</strong> / <strong>.xls</strong>. Лист Excel — первый
            лист.
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
              {bulkPreview.errors.length > 12 ? (
                <li>… и ещё {bulkPreview.errors.length - 12} сообщений</li>
              ) : null}
            </ul>
          ) : null}
          <div className="cabinet-actions" style={{ marginTop: "0.85rem" }}>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy || bulkPreview.rows.length === 0}
              onClick={onBulkImport}
            >
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">
                Импортировать{bulkPreview.rows.length ? ` (${bulkPreview.rows.length})` : ""}
              </span>
            </button>
          </div>
        </div>
      </div>

      <h2 className="cabinet-section-title">Поиск по номеру диплома</h2>
      <p className="cabinet-section-lead">
        Введите номер так, как он указан в реестре. Пример формата: <strong>ВСГ 1234567</strong> (буквы серии, пробел, цифры).
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
          <button
            type="button"
            className="btn btn--secondary cabinet-annul-btn"
            disabled={busy}
            onClick={onAnnulDiploma}
          >
            <span className="btn__label">Аннулировать</span>
          </button>
        </div>
        <p className="cabinet-card__hint" style={{ marginTop: "0.65rem", marginBottom: 0 }}>
          Сравнение номера без учёта регистра.
        </p>
        {annulFeedback ? (
          <p
            className="cabinet-card__hint"
            style={{
              marginTop: "0.65rem",
              marginBottom: 0,
              color:
                annulFeedback.type === "ok" ? "rgba(0, 242, 255, 0.88)" : "rgba(255, 201, 212, 0.95)",
            }}
            role={annulFeedback.type === "err" ? "alert" : "status"}
          >
            {annulFeedback.text}
          </p>
        ) : null}
      </div>

    </CabinetShell>
  );
}
