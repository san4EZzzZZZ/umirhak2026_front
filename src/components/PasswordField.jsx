import { useId, useState } from "react";

function IconEye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
        fill="currentColor"
        fillOpacity="0.85"
      />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.33-1.03 2.45-2.28 3.31-3.67-1.73-3.89-6-7-11-7-1.43 0-2.8.26-4.09.69l2.17 2.17c.57-.23 1.18-.36 1.83-.36zm-8-2.73 2.28 2.28A11.93 11.93 0 0 0 1 12c1.73 3.89 6 7 11 7 1.55 0 3.03-.3 4.38-.84l.42.42 1.41 1.41 1.98-1.98-16-16-1.98 1.98zm5.6 5.6 1.65 1.65A2.98 2.98 0 0 1 12 15c-1.66 0-3-1.34-3-3 0-.52.13-1.02.36-1.45l1.24 1.24z"
        fill="currentColor"
        fillOpacity="0.85"
      />
    </svg>
  );
}

export default function PasswordField({
  variant = "auth",
  label,
  name,
  autoComplete = "current-password",
  required,
  placeholder,
  defaultValue,
  value,
  onChange,
  minLength,
  className = "",
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isCabinet = variant === "cabinet";

  const wrapClass = isCabinet ? "cabinet-field__password-wrap" : "field__password-wrap";
  const inputClass = isCabinet ? "cabinet-field__input cabinet-field__input--password" : "field__input field__input--password";
  const toggleClass = isCabinet ? "cabinet-field__password-toggle" : "field__password-toggle";

  const inputProps = {
    id,
    name,
    autoComplete,
    required,
    placeholder,
    minLength,
    className: inputClass,
    type: visible ? "text" : "password",
  };

  if (value !== undefined) {
    inputProps.value = value;
    inputProps.onChange = onChange;
  } else if (defaultValue !== undefined) {
    inputProps.defaultValue = defaultValue;
  }

  const inner = (
    <>
      <div className={wrapClass}>
        <input {...inputProps} />
        <button
          type="button"
          className={toggleClass}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </>
  );

  if (isCabinet) {
    return (
      <div className={`cabinet-field cabinet-field--password ${className}`.trim()}>
        <span className="cabinet-field__label">{label}</span>
        {inner}
      </div>
    );
  }

  return (
    <div className={`field field--password ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {inner}
    </div>
  );
}
