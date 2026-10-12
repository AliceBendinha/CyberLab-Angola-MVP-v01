import { createContext, useContext } from "react";
import {
  getGetAuthMeQueryKey,
  useGetAuthMe,
  type AuthUser,
} from "@workspace/api-client-react";
import { getApiErrorStatus } from "./auth-errors";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isUnauthenticated: boolean;
  error: unknown;
  retry: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const query = useGetAuthMe({
    query: {
      queryKey: getGetAuthMeQueryKey(),
      retry: false,
      staleTime: 30_000,
    },
  });

  const value: AuthContextValue = {
    user: query.data ?? null,
    isLoading: query.isPending,
    isUnauthenticated: getApiErrorStatus(query.error) === 401,
    error: query.error,
    retry: () => {
      void query.refetch();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
