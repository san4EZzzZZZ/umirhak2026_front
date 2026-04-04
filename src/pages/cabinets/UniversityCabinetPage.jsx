import { useCallback, useEffect, useState } from "react";
import * as universityRegistryApi from "../../api/universityRegistryApi.js";
import { parseDiplomaImportFile } from "../../utils/parseDiplomaImport.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

/** Данные с Kotlin-бэкенда: см. universityRegistryApi.js */

export default function UniversityCabinetPage() {
  const [stats, setStats] = useState({ pendingSignature: "—", inRegistry: "—", addedThisMonth: "—" });
  const [packages, setPackages] = useState([]);
  const [diplomas, setDiplomas] = useState([]);
  const [busy, setBusy] = useState(false);
  const [diplomaFormError, setDiplomaFormError] = useState(null);
  const [bulkPreview, setBulkPreview] = useState({ rows: [], errors: [] });
  const [bulkMessage, setBulkMessage] = useState(null);

  const load = useCallback(async () => {
    const [s, pkgs, dips] = await Promise.all([
      universityRegistryApi.getRegistryDashboardStats(),
      universityRegistryApi.listRegistryPackages(),
      universityRegistryApi.listDiplomaRecords(),
    ]);
    setStats({
      pendingSignature: String(s.pendingSignature),
      inRegistry: String(s.inRegistry),
      addedThisMonth: s.addedThisMonth >= 0 ? `+${s.addedThisMonth}` : String(s.addedThisMonth),
    });
    setPackages(pkgs);
    setDiplomas(dips);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async () => {
    setBusy(true);
    try {
      await universityRegistryApi.uploadRegistryPackage(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onSign = async () => {
    setBusy(true);
    try {
      const first = packages[0];
      if (first) await universityRegistryApi.signRegistryPackage(first.fileName);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const onAddOneDiploma = async (e) => {
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
    setBusy(true);
    try {
      await universityRegistryApi.addDiplomaRecord({ fullName, year, specialty, diplomaNumber });
      e.currentTarget.reset();
      await load();
    } catch {
      setDiplomaFormError("Не удалось сохранить запись.");
    } finally {
      setBusy(false);
    }
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

  const onBulkImport = async () => {
    if (bulkPreview.rows.length === 0) return;
    setBusy(true);
    setBulkMessage(null);
    try {
      const { added } = await universityRegistryApi.addDiplomaRecordsBulk(bulkPreview.rows);
      setBulkPreview({ rows: [], errors: [] });
      setBulkMessage(`Импортировано записей: ${added}`);
      await load();
    } catch {
      setBulkMessage("Ошибка импорта.");
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = (st) => {
    if (st === "IN_REGISTRY") return { text: "В реестре", cls: "cabinet-pill--ok" };
    if (st === "SIGNATURE") return { text: "Подпись", cls: "cabinet-pill--wait" };
    return { text: "Проверка", cls: "cabinet-pill--wait" };
  };

  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <CabinetShell
      badge="Личный кабинет ВУЗа"
      title="Реестр и подписание данных"
      subtitle="Управление выгрузками выпускников, контроль статуса электронной подписи и публикации в едином реестре проверки дипломов."
    >
      <div className="cabinet-grid cabinet-grid--stats">
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Ожидают подписи</h2>
          <p className="cabinet-card__meta">{stats.pendingSignature}</p>
          <p className="cabinet-card__hint">Пакеты загружены, требуется КЭП уполномоченного лица</p>
        </div>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">В реестре</h2>
          <p className="cabinet-card__meta">{stats.inRegistry}</p>
          <p className="cabinet-card__hint">Записи об образовании с действующей подписью</p>
        </div>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">За месяц</h2>
          <p className="cabinet-card__meta">{stats.addedThisMonth}</p>
          <p className="cabinet-card__hint">Новые записи после последней синхронизации</p>
        </div>
      </div>

      <h2 className="cabinet-section-title">Реестр дипломов</h2>
      <p className="cabinet-section-lead">
        Поля: <strong>ФИО</strong>, <strong>год выпуска</strong>, <strong>специальность</strong>, <strong>номер диплома</strong>. В CSV/Excel первая строка — заголовки
        (например: ФИО; Год; Специальность; Номер диплома) или четыре колонки без заголовка в этом порядке.
      </p>

      <div className="cabinet-grid cabinet-grid--2" style={{ marginTop: "1rem" }}>
        <div className="cabinet-card admin-form-card">
          <h3 className="cabinet-card__title">Добавить один диплом</h3>
          <p className="cabinet-card__hint" style={{ marginBottom: "0.85rem" }}>
            Запись сохраняется локально в браузере (демо). Kotlin: POST /api/v1/university/diplomas.
          </p>
          {diplomaFormError ? (
            <p className="auth-error" role="alert">
              {diplomaFormError}
            </p>
          ) : null}
          <form className="admin-user-form" onSubmit={onAddOneDiploma}>
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
                <span className="btn__label">Добавить в реестр</span>
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

      <div className="cabinet-table-wrap" style={{ marginTop: "1.5rem" }}>
        <h3 className="cabinet-table-title">Загруженные записи о дипломах</h3>
        <table className="cabinet-table cabinet-table--admin">
          <thead>
            <tr>
              <th scope="col">ФИО</th>
              <th scope="col">Год</th>
              <th scope="col">Специальность</th>
              <th scope="col">Номер диплома</th>
              <th scope="col">Добавлено</th>
            </tr>
          </thead>
          <tbody>
            {diplomas.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                  Пока нет записей — добавьте диплом вручную или импортируйте файл.
                </td>
              </tr>
            ) : (
              diplomas.map((d) => (
                <tr key={d.id}>
                  <td>{d.fullName}</td>
                  <td>{d.year}</td>
                  <td>{d.specialty}</td>
                  <td>{d.diplomaNumber}</td>
                  <td>{fmtDate(d.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="cabinet-section-title" style={{ marginTop: "2.25rem" }}>
        Пакеты выгрузки (XML)
      </h2>
      <div className="cabinet-actions">
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onUpload}>
          <span className="btn__shine" aria-hidden="true" />
          <span className="btn__label">Загрузить реестр</span>
        </button>
        <button type="button" className="btn btn--secondary" disabled={busy || packages.length === 0} onClick={onSign}>
          <span className="btn__label">Подписать пакет</span>
        </button>
      </div>

      <div className="cabinet-table-wrap" style={{ marginTop: "1.75rem" }}>
        <table className="cabinet-table">
          <thead>
            <tr>
              <th scope="col">Пакет</th>
              <th scope="col">Загружен</th>
              <th scope="col">Статус</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ color: "var(--text-muted)" }}>
                  Нет данных — Kotlin: GET /api/v1/university/registry/packages
                </td>
              </tr>
            ) : (
              packages.map((p) => {
                const { text, cls } = statusLabel(p.status);
                return (
                  <tr key={p.fileName}>
                    <td>{p.fileName}</td>
                    <td>{p.uploadedAt}</td>
                    <td>
                      <span className={`cabinet-pill ${cls}`}>{text}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </CabinetShell>
  );
}
