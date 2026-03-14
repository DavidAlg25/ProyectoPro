import dotenv from 'dotenv';
import { createPool } from "mysql2/promise";
// Load environment variables from the .env file
dotenv.config();
// Create a connection pool to the MySQL database using environment variables
export const connect = createPool({
  host:process.env.DB_HOST,
  user:process.env.DB_USER,
  password:process.env.DB_PASSWORD,
  database:process.env.DB_NAME,
  port:process.env.DB_PORT
});