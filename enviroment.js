import dotenv from "dotenv";

dotenv.config();

export const DB_URL = process.env.MONGO_URI; // khớp với .env
export const DC_TOKEN = process.env.DISCORD_TOKEN;
export const CLIENT_ID = process.env.CLIENT_ID;
