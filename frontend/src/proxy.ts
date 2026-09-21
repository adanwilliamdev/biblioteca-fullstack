import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16: `proxy.ts` substitui o antigo `middleware.ts`.
 *
 * Só faz o primeiro filtro de acesso, sem chamar o backend: se não existe nenhum cookie
 * de sessão, redireciona para /login antes de renderizar. A validação real (JWT, roles)
 * continua sendo do FastAPI, e o AuthGate no cliente cobre sessões expiradas.
 */
const PUBLIC_PATHS = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession =
    request.cookies.has("access_token") || request.cookies.has("refresh_token");

  if (!hasSession && !PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
