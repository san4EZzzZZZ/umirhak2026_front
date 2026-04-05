import { useCallback, useState } from "react";

export function useSubmitRipple() {
  const [rippling, setRippling] = useState(false);

  const triggerRipple = useCallback(() => {
    setRippling(false);
    requestAnimationFrame(() => {
      setRippling(true);
      window.setTimeout(() => setRippling(false), 600);
    });
  }, []);

  return { rippling, triggerRipple };
}
