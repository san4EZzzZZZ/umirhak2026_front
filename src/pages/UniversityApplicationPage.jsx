import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";

export default function UniversityApplicationPage() {
  const [formError, setFormError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const universityName = formData.get("universityName")?.toString().trim() ?? "";
    const contactFullName = formData.get("contactFullName")?.toString().trim() ?? "";
    const contactPhone = formData.get("contactPhone")?.toString().trim() ?? "";

    if (!universityName || !contactFullName || !contactPhone) {
      setFormError("Заполните все обязательные поля.");
      return;
    }

    setSubmitted(true);
    event.currentTarget.reset();
  };

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="university-application-title">
        <div className="auth-card__glow" aria-hidden="true" />

        {!submitted ? (
          <>
            <h1 id="university-application-title" className="auth-title">
              Заявка на подключение вуза
            </h1>
            <p className="auth-subtitle">
              Оставьте контакты, и мы свяжемся с вами для регистрации образовательной организации.
            </p>

            <p
              className={`auth-error${formError ? " is-visible" : ""}`}
              role={formError ? "alert" : undefined}
              aria-live="polite"
              aria-hidden={!formError}
            >
              {formError ?? ""}
            </p>

            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <label className="field">
                <span className="field__label">Наименование вуза</span>
                <input
                  type="text"
                  name="universityName"
                  required
                  className="field__input"
                  placeholder="Например, КазНУ имени аль-Фараби"
                />
              </label>

              <label className="field">
                <span className="field__label">ФИО контактного лица</span>
                <input
                  type="text"
                  name="contactFullName"
                  required
                  className="field__input"
                  placeholder="Иванов Иван Иванович"
                />
              </label>

              <label className="field">
                <span className="field__label">Номер телефона контактного лица</span>
                <input
                  type="tel"
                  name="contactPhone"
                  required
                  className="field__input"
                  placeholder="+7 (___) ___-__-__"
                />
              </label>

              <button type="submit" className="btn btn--primary">
                <span className="btn__shine" aria-hidden="true" />
                <span className="btn__label">Отправить заявку</span>
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 id="university-application-title" className="auth-title auth-title--application-success">
              Спасибо, ваша заявка принята!
            </h1>
            <p className="auth-success auth-success--application">
              Мы получили вашу заявку и свяжемся с контактным лицом для дальнейшей регистрации вуза в системе.
            </p>
          </>
        )}

        <p className={`auth-crosslink${submitted ? " auth-crosslink--spacious" : ""}`}>
          <Link to="/" className="link-muted">
            ← На главную
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}
