import { useState } from "react";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

function mockToken() {
  const part = () => Math.random().toString(36).slice(2, 10);
  return `verify_${part()}${part()}`;
}

export default function StudentCabinetPage() {
  const [issued, setIssued] = useState(null);

  const issueLink = () => {
    const token = mockToken();
    const url = `${window.location.origin}/verify/${token}`;
    setIssued({ token, url, ttl: "72 ч", at: new Date().toLocaleString("ru-RU") });
  };

  return (
    <CabinetShell
      badge="Студент / выпускник"
      title="Мой диплом в реестре"
      subtitle="Просмотр сведений о записи и выпуск одноразовой ссылки или QR для проверки работодателем (срок действия и отзыв настраиваются политикой вуза)."
    >
      <div className="cabinet-grid cabinet-grid--2">
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Статус записи</h2>
          <p className="cabinet-card__meta" style={{ fontSize: "1rem", fontWeight: 600 }}>
            Подтверждена в реестре
          </p>
          <p className="cabinet-card__hint">ВУЗ: демо-университет · выпуск 2025 · специальность «Прикладная информатика»</p>
        </div>
        <div className="cabinet-card">
          <h2 className="cabinet-card__title">Документ</h2>
          <p className="cabinet-card__meta" style={{ fontSize: "1rem", fontWeight: 600 }}>
            Диплом бакалавра
          </p>
          <p className="cabinet-card__hint">Серия и номер скрыты; полные реквизиты доступны при проверке по выданной вами ссылке</p>
        </div>
      </div>

      <div className="cabinet-card" style={{ marginTop: "1rem" }}>
        <h2 className="cabinet-card__title">Проверка для HR</h2>
        <p className="cabinet-card__hint" style={{ marginBottom: "0.85rem" }}>
          Сгенерируйте ссылку с ограниченным сроком (TTL). После отзыва или истечения срока проверка вернёт недействительный статус.
        </p>
        <div className="cabinet-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn--primary" onClick={issueLink}>
            <span className="btn__shine" aria-hidden="true" />
            <span className="btn__label">Выпустить ссылку / QR</span>
          </button>
        </div>
        {issued ? (
          <div className="cabinet-mock" role="status">
            <div>Выдано: {issued.at}</div>
            <div>TTL: {issued.ttl}</div>
            <div style={{ marginTop: "0.5rem" }}>{issued.url}</div>
          </div>
        ) : (
          <p className="cabinet-card__hint" style={{ marginTop: "0.75rem" }}>
            Демо: кнопка создаёт фиктивный токен для интерфейса; интеграция с бэкендом подставит реальный URL и параметры отзыва.
          </p>
        )}
      </div>
    </CabinetShell>
  );
}
