import { useState } from "react";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

const MOCK_ROWS = [
  { id: "1", fio: "Иванов И. И.", vuz: "Демо-университет", year: "2025", status: "Совпадение в реестре" },
  { id: "2", fio: "Петрова А. С.", vuz: "Демо-университет", year: "2024", status: "Совпадение в реестре" },
];

export default function EmployerCabinetPage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  const onSearch = (e) => {
    e.preventDefault();
    setSearched(true);
  };

  const rows = searched
    ? MOCK_ROWS.filter((r) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return r.fio.toLowerCase().includes(q) || r.vuz.toLowerCase().includes(q);
      })
    : [];

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
            <button type="submit" className="btn btn--primary" style={{ width: "100%", marginTop: 0 }}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">Найти</span>
            </button>
          </form>
        </div>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Сканирование QR</h2>
          <p className="cabinet-card__hint" style={{ margin: 0 }}>
            Откройте камеру устройства и наведите на QR выпускника. В демо-интерфейсе используйте поиск по ФИО; модуль сканера
            подключается на этапе интеграции.
          </p>
          <div className="cabinet-actions" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn btn--secondary" disabled>
              <span className="btn__label">Сканировать (скоро)</span>
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
