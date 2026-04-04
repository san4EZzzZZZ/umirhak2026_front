import { Link } from "react-router-dom";
import logoSvg from "../assets/logo.svg";

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
            <img src={logoSvg} alt="" className="brand__logo" width="203" height="48" />
          </span>
        </Link>
        {nav ?? <p className="top-bar__hint">Проверка дипломов · единый реестр</p>}
      </header>

      <main className={mainClassName}>{children}</main>
    </>
  );
}
