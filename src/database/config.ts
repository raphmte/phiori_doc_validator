export const databaseConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "aa",
  port: parseInt(process.env.DB_PORT || "3306"),
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),

  // garante que valores BIGINT (como o code snowflake) cheguem como string,
  // evitando perda de precisão
  supportBigNumbers: true,
  bigIntAsNumber: false,
  dateStrings: true,
};
