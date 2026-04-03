import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as platformAdminsApi from "../../api/adminPlatformAdminsApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import "./cabinet.css";

export default function SuperAdminCabinetPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await platformAdminsApi.listPlatformAdmins();
      setAdmins(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const login = fd.get("login")?.toString().trim();
    const fullName = fd.get("fullName")?.toString().trim();
    const temporaryPassword = fd.get("temporaryPassword")?.toString() ?? "";
    if (!login || !fullName || !temporaryPassword) {
      setFormError("Заполните все поля.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await platformAdminsApi.createPlatformAdmin({
        login,
        fullName,
        temporaryPassword,
      });
      setAdmins((prev) => [...prev, created]);
      e.currentTarget.reset();
    } catch (err) {
      if (err?.message === "duplicate") {
        setFormError("Администратор с таким логином уже есть.");
      } else if (err?.message === "reserved") {
        setFormError("Этот логин зарезервирован.");
      } else {
        setFormError("Не удалось создать запись.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id, builtIn) => {
    if (builtIn) return;
    if (!window.confirm("Удалить администратора платформы? Он потеряет доступ после выхода из сессии.")) return;
    try {
      await platformAdminsApi.deletePlatformAdmin(id);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch {
      window.alert("Удаление недоступно (встроенная запись или ошибка API).");
    }
  };

  return (
    <CabinetShell
      badge="Суперпользователь"
      title="Администраторы платформы"
      subtitle="Создание учётных записей операторов с доступом к панели пользователей ВУЗов. После подключения Kotlin замените заглушку в src/api/adminPlatformAdminsApi.js."
    >
      <p className="cabinet-card__hint" style={{ marginBottom: "1.25rem" }}>
        <Link to="/cabinet/admin" className="link-muted" style={{ fontWeight: 600 }}>
          Пользователи ВУЗов →
        </Link>
      </p>

      <div className="cabinet-card admin-form-card">
        <h2 className="cabinet-card__title">Добавить администратора</h2>
        <p className="cabinet-card__hint" style={{ marginBottom: "1rem" }}>
          В демо-режиме логин и пароль сохраняются в браузере; в продакшене пароль задаёт бэкенд или письмо-приглашение.
        </p>
        {formError ? (
          <p className="auth-error" role="alert">
            {formError}
          </p>
        ) : null}
        <form className="admin-user-form" onSubmit={onCreate}>
          <div className="admin-user-form__grid">
            <label className="cabinet-field">
              <span className="cabinet-field__label">Логин (email)</span>
              <input className="cabinet-field__input" name="login" type="email" required placeholder="ops@diasoft.ru" />
            </label>
            <label className="cabinet-field">
              <span className="cabinet-field__label">ФИО</span>
              <input className="cabinet-field__input" name="fullName" required placeholder="Петров Пётр Петрович" />
            </label>
            <label className="cabinet-field admin-user-form__full">
              <span className="cabinet-field__label">Временный пароль</span>
              <input
                className="cabinet-field__input"
                name="temporaryPassword"
                type="password"
                required
                placeholder="Передайте администратору отдельным каналом"
                autoComplete="new-password"
              />
            </label>
          </div>
          <div className="cabinet-actions" style={{ marginTop: "1rem" }}>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">{submitting ? "Создание…" : "Создать администратора"}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="cabinet-card" style={{ marginTop: "1.25rem" }}>
        <h2 className="cabinet-card__title">Список администраторов</h2>
        <p className="cabinet-card__hint">Встроенный демо-логин нельзя удалить; добавленные здесь можно.</p>
        {loading ? (
          <p className="cabinet-card__hint">Загрузка…</p>
        ) : (
          <div className="cabinet-table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="cabinet-table cabinet-table--admin">
              <thead>
                <tr>
                  <th scope="col">Логин</th>
                  <th scope="col">ФИО</th>
                  <th scope="col">Тип</th>
                  <th scope="col">Статус</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td>{a.login}</td>
                    <td>{a.fullName}</td>
                    <td>{a.builtIn ? "Встроенный" : "Добавленный"}</td>
                    <td>
                      <span className={`cabinet-pill ${a.active ? "cabinet-pill--ok" : "cabinet-pill--wait"}`}>
                        {a.active ? "Активен" : "Отключён"}
                      </span>
                    </td>
                    <td>
                      {a.builtIn ? (
                        <span className="cabinet-card__hint">—</span>
                      ) : (
                        <button type="button" className="cabinet-user__logout" onClick={() => onDelete(a.id, a.builtIn)}>
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CabinetShell>
  );
}
