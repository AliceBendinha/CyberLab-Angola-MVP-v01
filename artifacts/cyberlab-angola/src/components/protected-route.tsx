import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/auth-provider";
import { getApiErrorMessage } from "../auth/auth-errors";
import DashboardPage from "../pages/dashboard-page";

export default function ProtectedRoute() {
  const { user, isLoading, isUnauthenticated, error, retry } = useAuth();

  if (isLoading) {
    return (
      <main className="site-shell dashboard-placeholder" aria-busy="true">
        <p className="dashboard-status" role="status">
          A confirmar a sua sessão…
        </p>
      </main>
    );
  }

  if (user) {
    return <DashboardPage />;
  }

  if (isUnauthenticated || !error) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="site-shell dashboard-placeholder">
      <section className="placeholder-box" role="alert">
        <h1>Não foi possível carregar a sua sessão</h1>
        <p>{getApiErrorMessage(error)}</p>
        <button className="button button-primary" type="button" onClick={retry}>
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
