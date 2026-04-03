import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as adminUniversityUsersApi from "../../api/adminUniversityUsersApi.js";
import { ROLES } from "../../auth/authPaths.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import CabinetShell from "../../components/CabinetShell.jsx";
import PasswordField from "../../components/PasswordField.jsx";
import "./cabinet.css";

const VUZ_ROLES = [
  { value: "REGISTRAR", label: "Регистратор (загрузка реестров)" },
  { value: "SIGNER", label: "Подписант (КЭП)" },
];

export default function AdminCabinetPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminUniversityUsersApi.listUniversityUsers();
      setUsers(list);
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
    const email = fd.get("email")?.toString().trim();
    const fullName = fd.get("fullName")?.toString().trim();
    const universityName = fd.get("universityName")?.toString().trim();
    const vuzUserRole = fd.get("vuzUserRole")?.toString();
    const temporaryPassword = fd.get("temporaryPassword")?.toString() ?? "";
    if (!email || !fullName || !universityName || !temporaryPassword) {
      setFormError("Заполните все поля формы.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await adminUniversityUsersApi.createUniversityUser({
        email,
        fullName,
        universityName,
        vuzUserRole: vuzUserRole === "SIGNER" ? "SIGNER" : "REGISTRAR",
        temporaryPassword,
      });
      setUsers((prev) => [...prev, created]);
      e.currentTarget.reset();
    } catch {
      setFormError("Ошибка создания (заглушка API).");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Удалить пользователя ВУЗа из списка?")) return;
    await adminUniversityUsersApi.deleteUniversityUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <CabinetShell
      badge="Админ-панель"
      title="Пользователи ВУЗов"
      subtitle="Создание учётных записей для регистраторов и подписантов. Данные ниже синхронизируются с Kotlin-бэкендом после подключения REST (см. src/api/adminUniversityUsersApi.js)."
    >
      {user?.role === ROLES.superadmin ? (
        <p className="cabinet-card__hint" style={{ marginBottom: "1.25rem" }}>
          <Link to="/cabinet/superadmin" className="link-muted" style={{ fontWeight: 600 }}>
            Администраторы платформы →
          </Link>
        </p>
      ) : null}

      <div className="cabinet-card admin-form-card">
        <h2 className="cabinet-card__title">Добавить пользователя ВУЗа</h2>
        <p className="cabinet-card__hint" style={{ marginBottom: "1rem" }}>
          Kotlin: POST /api/v1/admin/university-users — после интеграции пароль уйдёт в письмо-приглашение или будет задан при первом входе.
        </p>
        {formError ? (
          <p className="auth-error" role="alert">
            {formError}
          </p>
        ) : null}
        <form className="admin-user-form" onSubmit={onCreate}>
          <div className="admin-user-form__grid">
            <label className="cabinet-field">
              <span className="cabinet-field__label">Email (логин)</span>
              <input className="cabinet-field__input" name="email" type="email" required placeholder="user@vuz.ru" />
            </label>
            <label className="cabinet-field">
              <span className="cabinet-field__label">ФИО</span>
              <input className="cabinet-field__input" name="fullName" required placeholder="Иванов Иван Иванович" />
            </label>
            <label className="cabinet-field">
              <span className="cabinet-field__label">Название ВУЗа</span>
              <input className="cabinet-field__input" name="universityName" required placeholder="Университет …" />
            </label>
            <label className="cabinet-field">
              <span className="cabinet-field__label">Роль в системе</span>
              <select className="cabinet-field__input" name="vuzUserRole" defaultValue="REGISTRAR">
                {VUZ_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <PasswordField
              variant="cabinet"
              className="admin-user-form__full"
              label="Временный пароль"
              name="temporaryPassword"
              required
              placeholder="Будет отправлен на Kotlin-бэкенд"
              autoComplete="new-password"
            />
          </div>
          <div className="cabinet-actions" style={{ marginTop: "1rem" }}>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">{submitting ? "Создание…" : "Создать пользователя"}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="cabinet-card" style={{ marginTop: "1.25rem" }}>
        <h2 className="cabinet-card__title">Список учётных записей</h2>
        <p className="cabinet-card__hint">Kotlin: GET /api/v1/admin/university-users</p>
        {loading ? (
          <p className="cabinet-card__hint">Загрузка…</p>
        ) : (
          <div className="cabinet-table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="cabinet-table cabinet-table--admin">
              <thead>
                <tr>
                  <th scope="col">Email</th>
                  <th scope="col">ФИО</th>
                  <th scope="col">ВУЗ</th>
                  <th scope="col">Роль</th>
                  <th scope="col">Статус</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: "var(--text-muted)" }}>
                      Нет записей
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.fullName}</td>
                      <td>{u.universityName}</td>
                      <td>{u.vuzUserRole === "SIGNER" ? "Подписант" : "Регистратор"}</td>
                      <td>
                        <span className={`cabinet-pill ${u.active ? "cabinet-pill--ok" : "cabinet-pill--wait"}`}>
                          {u.active ? "Активен" : "Отключён"}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="cabinet-user__logout" onClick={() => onDelete(u.id)}>
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CabinetShell>
  );
}
