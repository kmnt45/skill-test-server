export interface IConfig {
  port: number;
  mongoUri: string;
  origin: string;
  frontendUrl: string;
  accessSecret: string;
  accessExpires: string;
  refreshSecret: string;
  refreshExpires: string;
  adminLogin: string;
  adminEmail: string;
  adminPassword: string;
  mailerUser: string;
  mailerPassword: string;
  mailerHost: string;
  mailerPort: string;
  mailerSignature: string;
}

interface IConfigurationReturns {
  app: IConfig;
}

export type Configuration = () => IConfigurationReturns;
