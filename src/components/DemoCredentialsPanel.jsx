import { DEMO_CREDENTIALS_LIST } from "../auth/demoAccounts.js";

const LABELS = {
  university: "ВУЗ",
  student: "Студент",
  employer: "HR работодатель",
};

export default function DemoCredentialsPanel() {
  return (
    <div className="auth-demo" aria-label="Демо-логины для входа">
      <p className="auth-demo__title">Демо-доступ (все кабинеты)</p>
      <table className="auth-demo__table">
        <thead>
          <tr>
            <th scope="col">Роль</th>
            <th scope="col">Логин</th>
            <th scope="col">Пароль</th>
          </tr>
        </thead>
        <tbody>
          {DEMO_CREDENTIALS_LIST.map((row) => (
            <tr key={row.roleKey}>
              <td>{LABELS[row.roleKey]}</td>
              <td>
                <code className="auth-demo__code">{row.login}</code>
              </td>
              <td>
                <code className="auth-demo__code">{row.password}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
