import { useId, useState } from "react";

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M2 12C3.8 8.9 7.3 7 12 7s8.2 1.9 10 5c-1.8 3.1-5.3 5-10 5S3.8 15.1 2 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M2 12C3.8 8.9 7.3 7 12 7s8.2 1.9 10 5c-1.8 3.1-5.3 5-10 5S3.8 15.1 2 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
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
