import mongoose from "mongoose";
import fs from "fs";
import { DB_URL } from "./enviroment.js";
import Map from "./map.schema.js";

async function main() {
  try {
    console.log("🔌 DB_URL:", DB_URL);

    // 1. Kết nối MongoDB
    const conn = await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);

    // 2. Đọc file ava.json
    const raw = fs.readFileSync("ava.json", "utf-8");
    const data = JSON.parse(raw);

    // 3. Xoá collection cũ (nếu có)
    await Map.deleteMany({});
    console.log("🗑️ Old data removed");

    // 4. Insert dữ liệu mới
    await Map.insertMany(data);
    console.log(`✅ Inserted ${data.length} documents`);

    // 5. Đóng kết nối
    await mongoose.connection.close();
    console.log("🔒 Connection closed");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();
