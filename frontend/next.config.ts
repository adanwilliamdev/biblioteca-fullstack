import type { NextConfig } from "next";

// URL do backend FastAPI. É lida no BUILD (rewrites entram no manifesto de rotas),
// então em Docker/hosts ela precisa existir como build arg / variável de build.
const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  // O navegador só conversa com o Next (mesma origem); /api/* é repassado ao FastAPI.
  // Assim os cookies httpOnly de sessão funcionam sem CORS e sem SameSite=None.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
