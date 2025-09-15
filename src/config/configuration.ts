export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/sellia',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3002,http://localhost:3000',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  api: {
    globalPrefix: 'api',
  },
});