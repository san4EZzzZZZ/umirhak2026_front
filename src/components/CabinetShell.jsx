import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/authApi.js";
import { ROLE_LABELS } from "../auth/authPaths.js";
import { useAuth } from "../auth/AuthContext.jsx";
import logoPng from "../assets/logo.png";

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
            <img src={logoPng} alt="" className="brand__logo" width="203" height="48" />
          </span>
        </Link>

        <div className="cabinet-user" aria-live="polite">
          <div className="cabinet-user__info">
            {user?.lastName || user?.firstName ? (
              <span className="cabinet-user__name">
                {[user.lastName, user.firstName].filter(Boolean).join(" ")}
              </span>
            ) : null}
            <span className="cabinet-user__email" title={user?.login}>
              {user?.login}
            </span>
            {user?.role && ROLE_LABELS[user.role] ? (
              <span className="cabinet-user__role">{ROLE_LABELS[user.role]}</span>
            ) : null}
          </div>
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
