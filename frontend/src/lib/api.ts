/**
 * Cliente HTTP do frontend.
 *
 * - Fala com /api/* na mesma origem (o Next repassa ao FastAPI via rewrites).
 * - A sessão vive em cookies httpOnly: o JS nunca vê os tokens. Aqui só reagimos a 401,
 *   renovando a sessão uma vez (com single-flight) e repetindo a requisição.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Params = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
  params?: Params;
  /** Não tenta renovar a sessão em caso de 401 (login, registro, refresh). */
  skipRefresh?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

/** Chamado quando a sessão não pôde ser renovada (o provider limpa o usuário do cache). */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  // Várias requisições podem receber 401 juntas; todas esperam o mesmo refresh.
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function buildUrl(path: string, params?: Params) {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.pathname + url.search;
}

async function parse(response: Response) {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function api<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, params, skipRefresh, headers, ...init } = options;

  const send = () =>
    fetch(buildUrl(path, params), {
      ...init,
      credentials: "same-origin",
      headers: { ...(json !== undefined && { "Content-Type": "application/json" }), ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });

  let response = await send();

  if (response.status === 401 && !skipRefresh) {
    if (await refreshSession()) {
      response = await send();
    }
    if (response.status === 401) unauthorizedHandler?.();
  }

  const data = await parse(response);
  if (!response.ok) {
    const message =
      (data && typeof data === "object" && "message" in data && String(data.message)) ||
      `Erro ${response.status}`;
    throw new ApiError(response.status, message, data);
  }
  return data as T;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status !== 500) return error.message;
  return fallback;
}
