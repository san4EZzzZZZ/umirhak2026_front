import { useState } from "react";
import * as employerRegistryApi from "../../api/employerRegistryApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

/** Kotlin: employerRegistryApi.js */

export default function EmployerCabinetPage() {
  const [university, setUniversity] = useState("");
  const [diplomaNumber, setDiplomaNumber] = useState("");
  const [rows, setRows] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const data = await employerRegistryApi.searchRegistry({
        university,
        diplomaNumber,
      });
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
      subtitle="Поиск по названию ВУЗа (или коду) и по номеру диплома, а также проверка через QR-код выпускника."
    >
      <div className="cabinet-grid cabinet-grid--2">
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Поиск в реестре</h2>
          <form onSubmit={onSearch}>
            <div className="cabinet-field">
              <label className="cabinet-field__label" htmlFor="hr-university">
                Название ВУЗа или код
              </label>
              <input
                id="hr-university"
                className="cabinet-field__input"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Например: DEMO или Демо-университет"
                autoComplete="off"
              />
            </div>
            <div className="cabinet-field">
              <label className="cabinet-field__label" htmlFor="hr-diploma-number">
                Номер диплома
              </label>
              <input
                id="hr-diploma-number"
                className="cabinet-field__input"
                value={diplomaNumber}
                onChange={(e) => setDiplomaNumber(e.target.value)}
                placeholder="Например: ВСГ 1234567"
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
            Kotlin: POST /api/v1/employer/verify/qr — передайте сырое содержимое QR после сканирования камерой. В демо кнопка вызывает заглушку.
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
                <th scope="col">Номер диплома</th>
                <th scope="col">Год</th>
                <th scope="col">Результат</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                    Ничего не найдено — уточните запрос или проверьте написание.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fio}</td>
                    <td>{r.vuz}</td>
                    <td>{r.diplomaNumber}</td>
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
