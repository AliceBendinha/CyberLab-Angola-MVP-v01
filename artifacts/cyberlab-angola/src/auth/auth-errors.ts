export function getApiErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as {
    status?: unknown;
    response?: { status?: unknown };
  };
  if (typeof candidate.status === "number") {
    return candidate.status;
  }
  return typeof candidate.response?.status === "number"
    ? candidate.response.status
    : null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir o pedido. Tente novamente.",
): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  }

  if (getApiErrorStatus(error) === 429) {
    return "Foram feitas demasiadas tentativas. Aguarde e tente novamente.";
  }
  if (error instanceof TypeError) {
    return "Não foi possível comunicar com o servidor. Verifique a sua ligação.";
  }
  return fallback;
}
