import mongoose from "mongoose";
import connectDB from "./db.js";
import Map from "./map.schema.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { DC_TOKEN, DB_URL } from "./enviroment.js";
import { log } from "console";

// Hàm đếm icons
async function checkResources(mapName) {
  // Lấy map theo tên
  const doc = await Map.findOne({ name: mapName });
  if (!doc) return "Không tìm thấy map";

  // Tạo object để đếm
  const counts = {};

  // Duyệt qua mảng resources
  doc.icons.forEach(icons => {
    counts[icons] = (counts[icons] || 0) + 1;
  });

  // Chuyển kết quả thành text
  const text = Object.entries(counts)
    .map(([res, count]) => `${res} x${count}`)
    .join(", ");

  // Trả kết quả
  return `${doc.name} (T${doc.tier}): ${text}`;
}

// Kết nối MongoDB và chạy thử
async function main() {
  await connectDB();
  const result = await checkResources("Casos-Aiagsum");
  console.log(result);
  mongoose.connection.close();
}
main();

//coman
const commands = [
    new SlashCommandBuilder()
        .setName("checkavalonmap")
        .setDescription("Kiểm tra tài nguyên bên trong map Avalon")
        .addStringOption(option =>
            option.setName("mapname")
                .setDescription("Tên map (ví dụ: Casos-Aiagsum)")
                // Sửa lỗi: Bắt buộc người dùng phải nhập tên map
                .setRequired(true)
        ),
];

// Khởi tạo REST client để tương tác với Discord API
const rest = new REST({ version: '10' }).setToken(DC_TOKEN);

// Hàm chính để đăng ký lệnh
(async () => {
    try {
        console.log("Đang đăng ký lệnh...");
        // Sử dụng Routes.applicationCommands để đăng ký lệnh chung cho bot
        // Thay thế CLIENT_ID bằng ID của bot của bạn
        await rest.put(
            Routes.applicationCommands(DC_TOKEN),
            { body: commands },
        );
        console.log("Đăng ký lệnh thành công!");
    } catch (error) {
        console.error("Lỗi khi đăng ký lệnh:", error);
    }
})();
// main();
