import mariadb from "mariadb";
import { databaseConfig } from "./config";

export const pool = mariadb.createPool(databaseConfig);
