import { useCallback, useEffect, useState } from "react";
import * as adminUniversityUsersApi from "../../api/adminUniversityUsersApi.js";
import CabinetShell from "../../components/CabinetShell.jsx";
import PasswordField from "../../components/PasswordField.jsx";
import "./cabinet.css";

export default function AdminCabinetPage() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminUniversityUsersApi.listUniversityUsers();
      setUniversities(list);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не удалось загрузить список ВУЗов.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    setFormError(null);
    setSuccess("");
    const fd = new FormData(formEl);
    const universityName = fd.get("universityName")?.toString().trim() ?? "";
    const email = fd.get("email")?.toString().trim() ?? "";
    const contactFullName = fd.get("contactFullName")?.toString().trim() ?? "";
    const password = fd.get("temporaryPassword")?.toString() ?? "";

    if (!universityName || !email || !contactFullName || !password) {
      setFormError("Заполните все поля формы.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await adminUniversityUsersApi.createUniversityUser({
        universityName,
        email,
        fullName: contactFullName,
        temporaryPassword: password,
      });
      setUniversities((prev) => [created, ...prev]);
      setSuccess("Аккаунт ВУЗа успешно создан.");
      formEl.reset();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не удалось создать аккаунт ВУЗа.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CabinetShell
      badge="Админ-панель"
      title="Аккаунты ВУЗов"
      subtitle="Администратор создает учетные записи ВУЗов. По требованиям: в поля code и name передается одно и то же значение — название ВУЗа."
    >
      <div className="cabinet-card admin-form-card">
        <h2 className="cabinet-card__title">Добавить аккаунт ВУЗа</h2>
        <p className="cabinet-card__hint" style={{ marginBottom: "1rem" }}>
          Введите название ВУЗа: оно будет использовано одновременно как code и как name.
        </p>
        {formError ? (
          <p className="auth-error is-visible" role="alert">
            {formError}
          </p>
        ) : null}
        {success ? (
          <p className="cabinet-cap-flash" role="status" style={{ marginBottom: "0.8rem" }}>
            {success}
          </p>
        ) : null}
        <form className="admin-user-form" onSubmit={onCreate}>
          <div className="admin-user-form__grid">
            <label className="cabinet-field admin-user-form__full">
              <span className="cabinet-field__label">Название ВУЗа (code + name)</span>
              <input className="cabinet-field__input" name="universityName" required placeholder="Донской государственный технический университет" />
            </label>
            <label className="cabinet-field">
              <span className="cabinet-field__label">Email для входа</span>
              <input className="cabinet-field__input" name="email" type="email" required placeholder="vuz@example.ru" />
            </label>
            <label className="cabinet-field">
              <span className="cabinet-field__label">Контактное ФИО</span>
              <input className="cabinet-field__input" name="contactFullName" required placeholder="Иванов Иван Иванович" />
            </label>
            <PasswordField
              variant="cabinet"
              className="admin-user-form__full"
              label="Пароль"
              name="temporaryPassword"
              required
              placeholder="Не короче 8 символов"
              autoComplete="new-password"
            />
          </div>
          <div className="cabinet-actions" style={{ marginTop: "1rem" }}>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              <span className="btn__shine" aria-hidden="true" />
              <span className="btn__label">{submitting ? "Создание…" : "Создать аккаунт ВУЗа"}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="cabinet-card" style={{ marginTop: "1.25rem" }}>
        <h2 className="cabinet-card__title">Список ВУЗов</h2>
        {loading ? (
          <p className="cabinet-card__hint">Загрузка…</p>
        ) : (
          <div className="cabinet-table-wrap" style={{ marginTop: "0.75rem" }}>
            <table className="cabinet-table cabinet-table--admin">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Название</th>
                  <th scope="col">Email</th>
                  <th scope="col">Контакт</th>
                  <th scope="col">Статус</th>
                </tr>
              </thead>
              <tbody>
                {universities.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--text-muted)" }}>
                      Нет записей
                    </td>
                  </tr>
                ) : (
                  universities.map((u) => (
                    <tr key={u.id}>
                      <td>{u.code || u.universityName}</td>
                      <td>{u.universityName}</td>
                      <td>{u.email}</td>
                      <td>{u.fullName}</td>
                      <td>
                        <span className={`cabinet-pill ${u.active ? "cabinet-pill--ok" : "cabinet-pill--wait"}`}>
                          {u.active ? "Активен" : "Отключён"}
                        </span>
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
