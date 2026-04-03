import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import logoSvg from "../assets/logo.svg";

export default function CabinetShell({ badge, title, subtitle, children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      signOut();
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      <div className="page-bg" aria-hidden="true">
        <div className="blob blob--1" />
        <div className="blob blob--2" />
        <div className="blob blob--3" />
        <div className="grid-overlay" />
      </div>

      <header className="top-bar top-bar--cabinet">
        <Link className="brand" to="/" aria-label="На главную">
          <span className="brand__mark">
            <img src={logoSvg} alt="" className="brand__logo" width="135" height="32" />
          </span>
        </Link>

        <div className="cabinet-user" aria-live="polite">
          <span className="cabinet-user__login" title={user?.login}>
            {user?.login}
          </span>
          <button type="button" className="cabinet-user__logout" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <main className="main main--cabinet">
        <div className="cabinet">
          <header className="cabinet__head">
            {badge ? <p className="cabinet__badge">{badge}</p> : null}
            <h1 className="cabinet__title">{title}</h1>
            {subtitle ? <p className="cabinet__subtitle">{subtitle}</p> : null}
          </header>
          {children}
        </div>
      </main>
    </>
  );
}
