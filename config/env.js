import { config } from "dotenv";

config({ path: "./.env" });

export const { PORT, MONGO_URI, JWT_SECRET, NODE_ENV } = process.env;