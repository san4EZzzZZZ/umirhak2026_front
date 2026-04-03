import { useCallback, useEffect, useState } from "react";
import * as universityRegistryApi from "../../api/universityRegistryApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

/** Данные с Kotlin-бэкенда: см. universityRegistryApi.js */

export default function UniversityCabinetPage() {
  const [stats, setStats] = useState({ pendingSignature: "—", inRegistry: "—", addedThisMonth: "—" });
  const [packages, setPackages] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, pkgs] = await Promise.all([
      universityRegistryApi.getRegistryDashboardStats(),
      universityRegistryApi.listRegistryPackages(),
    ]);
    setStats({
      pendingSignature: String(s.pendingSignature),
      inRegistry: String(s.inRegistry),
      addedThisMonth: s.addedThisMonth >= 0 ? `+${s.addedThisMonth}` : String(s.addedThisMonth),
    });
    setPackages(pkgs);
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

  const statusLabel = (st) => {
    if (st === "IN_REGISTRY") return { text: "В реестре", cls: "cabinet-pill--ok" };
    if (st === "SIGNATURE") return { text: "Подпись", cls: "cabinet-pill--wait" };
    return { text: "Проверка", cls: "cabinet-pill--wait" };
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
