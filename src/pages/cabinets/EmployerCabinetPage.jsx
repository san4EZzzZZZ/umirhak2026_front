import { useState } from "react";
import * as employerRegistryApi from "../../api/employerRegistryApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

/** Kotlin: employerRegistryApi.js */

export default function EmployerCabinetPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const data = await employerRegistryApi.searchRegistry(query);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  const onScanStub = async () => {
    await employerRegistryApi.verifyQrPayload("");
    window.alert("Заглушка: Kotlin POST /api/v1/employer/verify/qr — подключите сканер и бэкенд.");
  };

  return (
    <CabinetShell
      badge="HR / работодатель"
      title="Проверка дипломов"
      subtitle="Поиск по реестру по ФИО и вузу, ручной ввод данных для сверки и сканирование QR-кода выпускника (в продакшене — отдельный поток с камерой)."
    >
      <div className="cabinet-grid cabinet-grid--2">
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Поиск в реестре</h2>
          <form onSubmit={onSearch}>
            <div className="cabinet-field">
              <label className="cabinet-field__label" htmlFor="hr-q">
                ФИО или фрагмент
              </label>
              <input
                id="hr-q"
                className="cabinet-field__input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Например: Иванов"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="btn btn--primary" style={{ width: "100%", marginTop: 0 }} disabled={loading}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">{loading ? "Поиск…" : "Найти"}</span>
            </button>
          </form>
        </div>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Сканирование QR</h2>
          <p className="cabinet-card__hint" style={{ margin: 0 }}>
            Kotlin: POST /api/v1/employer/verify/qr — передайте сырое содержимое QR. В демо кнопка вызывает только заглушку.
          </p>
          <div className="cabinet-actions" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn btn--secondary" onClick={onScanStub}>
              <span className="btn__label">Демо: проверка QR</span>
            </button>
          </div>
        </div>
      </div>

      {searched ? (
        <div className="cabinet-table-wrap">
          <table className="cabinet-table">
            <thead>
              <tr>
                <th scope="col">ФИО</th>
                <th scope="col">ВУЗ</th>
                <th scope="col">Год</th>
                <th scope="col">Результат</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--text-muted)" }}>
                    Ничего не найдено — уточните запрос или проверьте написание.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fio}</td>
                    <td>{r.vuz}</td>
                    <td>{r.year}</td>
                    <td>
                      <span className="cabinet-pill cabinet-pill--ok">{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </CabinetShell>
  );
}
