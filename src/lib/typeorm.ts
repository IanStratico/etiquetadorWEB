import "reflect-metadata";
import { DataSource } from "typeorm";
import { Piece } from "@/lib/entities/Piece";
import { Lot } from "@/lib/entities/Lot";

const globalForTypeOrm = globalThis as unknown as {
  __typeormDataSource?: DataSource;
};

const host = process.env.MYSQL_HOST || process.env.DB_HOST;
const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);
const username = process.env.MYSQL_USERNAME || process.env.DB_USERNAME;
const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
const database = process.env.MYSQL_DATABASE || process.env.DB_DATABASE;

if (!host || !username || !database) {
  console.warn(
    "MySQL connection environment variables are not fully configured."
  );
}

const dataSource =
  globalForTypeOrm.__typeormDataSource ??
  new DataSource({
    type: "mysql",
    host,
    port,
    username,
    password,
    database,
    synchronize: true,
    logging: false,
    entities: [Lot, Piece],
  });

if (!globalForTypeOrm.__typeormDataSource) {
  globalForTypeOrm.__typeormDataSource = dataSource;
}

export const getDataSource = async () => {
  if (!host || !username || !database) {
    throw new Error(
      "MySQL connection environment variables (host, username, database) deben configurarse en el archivo .env"
    );
  }

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
};
