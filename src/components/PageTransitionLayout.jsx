import { useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

/**
 * При смене маршрута — тонкая полоса сверху (градиент + лёгкое свечение).
 * Анимируется только узкая полоска (scaleX + затухание), без затемнения экрана.
 */
function NavigationRouteAccent() {
  const location = useLocation();
  const prevPathRef = useRef(null);
  const genRef = useRef(0);
  const [accentGen, setAccentGen] = useState(null);

  useLayoutEffect(() => {
    const next = `${location.pathname}${location.search}`;
    if (prevPathRef.current === null) {
      prevPathRef.current = next;
      return;
    }
    if (prevPathRef.current === next) return;
    prevPathRef.current = next;
    genRef.current += 1;
    setAccentGen(genRef.current);
  }, [location.pathname, location.search]);

  const handleEnd = (gen) => {
    setAccentGen((current) => (current === gen ? null : current));
  };

  if (accentGen == null) return null;

  return (
    <div
      key={accentGen}
      className="nav-route-accent"
      aria-hidden="true"
      onAnimationEnd={() => handleEnd(accentGen)}
    />
  );
}

export default function PageTransitionLayout() {
  return (
    <>
      <NavigationRouteAccent />
      <div className="page-transition-root">
        <Outlet />
      </div>
    </>
  );
}
