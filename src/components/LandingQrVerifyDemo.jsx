/**
 * Декоративная анимация для лендинга: «сканирование» QR и подтверждение галочкой.
 */
export default function LandingQrVerifyDemo() {
  return (
    <div className="landing-qr-verify" aria-hidden="true">
      <div className="landing-qr-verify__glow" />
      <div className="landing-qr-verify__panel">
        <p className="landing-qr-verify__label">Проверка по QR</p>
        <div className="landing-qr-verify__screen">
          <div className="landing-qr-verify__corners" />
          <div className="landing-qr-verify__qr" />
          <div className="landing-qr-verify__scan-line" />
          <div className="landing-qr-verify__success">
            <svg className="landing-qr-verify__check" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="28" className="landing-qr-verify__check-ring" />
              <path
                className="landing-qr-verify__check-path"
                d="M20 33l8 8 16-20"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="landing-qr-verify__status" aria-hidden="true">
          <span className="landing-qr-verify__status-scan">Сканируем код…</span>
          <span className="landing-qr-verify__status-ok">Диплом подтверждён</span>
        </div>
      </div>
    </div>
  );
}
