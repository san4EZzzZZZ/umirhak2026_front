import { useEffect, useState } from "react";
import * as studentDiplomaApi from "../../api/studentDiplomaApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

/** Kotlin: studentDiplomaApi.js */

export default function StudentCabinetPage() {
  const [record, setRecord] = useState(null);
  const [issued, setIssued] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const issueLink = async () => {
    const res = await studentDiplomaApi.issueVerificationLink({ ttlHours: 72 });
    setIssued({
      token: res.token,
      url: res.verificationUrl,
      ttl: `${res.ttlHours} ч`,
      at: new Date(res.issuedAt).toLocaleString("ru-RU"),
    });
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
              <p className="cabinet-card__hint">
                Серия и номер скрыты; полные реквизиты доступны при проверке по выданной вами ссылке
              </p>
            </>
          )}
        </div>
      </div>

      <div className="cabinet-card" style={{ marginTop: "1rem" }}>
        <h2 className="cabinet-card__title">Проверка для HR</h2>
        <p className="cabinet-card__hint" style={{ marginBottom: "0.85rem" }}>
          Сгенерируйте ссылку с ограниченным сроком (TTL). Kotlin: POST /api/v1/student/verification-links
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
            Сейчас ответ приходит из заглушки; после подключения Kotlin-бэкенда здесь будет реальный токен и политика отзыва.
          </p>
        )}
      </div>
    </CabinetShell>
  );
}
