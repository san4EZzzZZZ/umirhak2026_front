import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function CabinetShell({ badge, title, subtitle, children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/", { replace: true });
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
        <Link className="brand" to="/" aria-label="DIASOFT — на главную">
          <span className="brand__mark" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#ffffff" />
              <path
                d="M8 28c8-12 8-20 24-20"
                stroke="#0a0a18"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M10 22c6-8 10-12 20-12"
                stroke="#0a0a18"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.65"
              />
            </svg>
          </span>
          <span className="brand__text">
            <span className="brand__name">DIASOFT</span>
            <span className="brand__tag">всё по-настоящему</span>
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
