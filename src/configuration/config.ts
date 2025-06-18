import { Configuration } from "./types";

export const configuration: Configuration = () => ({
  app: {
    port: parseInt(process.env.PORT ?? "5000"),
    mongoUri: process.env.MONGO_URI,
    origin: process.env.ORIGIN,
    frontendUrl: process.env.FRONTEND_URL,
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN,
    adminLogin: process.env.ADMIN_LOGIN,
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    mailerUser: process.env.MAILER_USER,
    mailerPassword: process.env.MAILER_PASSWORD,
    mailerPort: process.env.MAILER_PORT ?? "465",
    mailerHost: process.env.MAILER_HOST,
    mailerSignature: process.env.MAILER_SIGNATURE ?? "1",
  },
});
