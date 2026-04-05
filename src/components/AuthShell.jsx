import { Link } from "react-router-dom";
import logoPng from "../assets/logo.png";

/** Оболочка публичных страниц; авторизация на бэкенде — через src/api/authApi.js */
export default function AuthShell({ children, nav, mainClassName = "main" }) {
  return (
    <>
      <div className="page-bg" aria-hidden="true">
        <div className="blob blob--1" />
        <div className="blob blob--2" />
        <div className="blob blob--3" />
        <div className="grid-overlay" />
      </div>

      <header className="top-bar">
        <Link className="brand" to="/" aria-label="На главную">
          <span className="brand__mark">
            <img src={logoPng} alt="" className="brand__logo" width="203" height="48" />
          </span>
          <span className="brand__text" aria-hidden="true">
            <span className="brand__name">
              <span className="brand__name-word brand__name-word--honest">Честный</span>{" "}
              <span className="brand__name-word brand__name-word--diploma">Диплом</span>
            </span>
          </span>
        </Link>
        {nav ?? <p className="top-bar__hint">Проверка дипломов · единый реестр</p>}
      </header>

      <main className={mainClassName}>{children}</main>
    </>
  );
}
