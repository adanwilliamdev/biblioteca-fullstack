export default () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),

  jwt: {
    // O valor abaixo é usado apenas se JWT_SECRET não estiver definida (ex: rodando local
    // sem .env). Gere uma chave própria com: openssl rand -base64 64
    // NUNCA use este valor padrão em produção — defina sempre JWT_SECRET no ambiente.
    secret: process.env.JWT_SECRET ?? 'd29ybGRzLW1vc3Qtc2VjcmV0LWtleS1jaGFuZ2UtaW4tcHJvZHVjdGlvbi1wbGVhc2U=',
    // Access token: vida curta (15 min por padrão), pois é enviado a cada requisição.
    expirationMs: parseInt(process.env.JWT_EXPIRATION_MS ?? '900000', 10),
    // Refresh token: vida longa (7 dias por padrão). Usado só para renovar o access token.
    refreshExpirationMs: parseInt(process.env.JWT_REFRESH_EXPIRATION_MS ?? '604800000', 10),
  },

  app: {
    cors: {
      // Domínios do frontend liberados no CORS. Separe por vírgula se tiver mais de um.
      allowedOrigins: (process.env.APP_CORS_ALLOWED_ORIGINS ?? 'http://localhost:*,http://127.0.0.1:*')
        .split(',')
        .map((s) => s.trim()),
    },
    // Marca os cookies de autenticação como Secure (só enviados via HTTPS).
    // Defina APP_COOKIE_SECURE=true em produção (atrás de HTTPS).
    cookieSecure: (process.env.APP_COOKIE_SECURE ?? 'false') === 'true',
  },

  rateLimit: {
    janelaMs: parseInt(process.env.APP_RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    maxTentativas: parseInt(process.env.APP_RATE_LIMIT_MAX_ATTEMPTS ?? '10', 10),
  },

  tmdb: {
    apiKey: process.env.TMDB_API_KEY ?? '',
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/w500',
  },
});
