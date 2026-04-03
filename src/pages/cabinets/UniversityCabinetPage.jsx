import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

export default function UniversityCabinetPage() {
  return (
    <CabinetShell
      badge="Личный кабинет ВУЗа"
      title="Реестр и подписание данных"
      subtitle="Управление выгрузками выпускников, контроль статуса электронной подписи и публикации в едином реестре проверки дипломов."
    >
      <div className="cabinet-grid cabinet-grid--stats">
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Ожидают подписи</h2>
          <p className="cabinet-card__meta">3</p>
          <p className="cabinet-card__hint">Пакеты загружены, требуется КЭП уполномоченного лица</p>
        </div>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">В реестре</h2>
          <p className="cabinet-card__meta">1 248</p>
          <p className="cabinet-card__hint">Записи об образовании с действующей подписью</p>
        </div>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">За месяц</h2>
          <p className="cabinet-card__meta">+86</p>
          <p className="cabinet-card__hint">Новые записи после последней синхронизации</p>
        </div>
      </div>

      <div className="cabinet-actions">
        <button type="button" className="btn btn--primary">
          <span className="btn__shine" aria-hidden="true" />
          <span className="btn__label">Загрузить реестр</span>
        </button>
        <button type="button" className="btn btn--secondary">
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
            <tr>
              <td>graduates_2025_spring.xml</td>
              <td>02.04.2026</td>
              <td>
                <span className="cabinet-pill cabinet-pill--wait">Подпись</span>
              </td>
            </tr>
            <tr>
              <td>graduates_2024_winter.xml</td>
              <td>15.01.2026</td>
              <td>
                <span className="cabinet-pill cabinet-pill--ok">В реестре</span>
              </td>
            </tr>
            <tr>
              <td>magistracy_2025.xml</td>
              <td>28.03.2026</td>
              <td>
                <span className="cabinet-pill cabinet-pill--wait">Проверка</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CabinetShell>
  );
}
