import mongoose from "mongoose";
import connectDB from "./db.js";
import Map from "./map.schema.js";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { DC_TOKEN, DB_URL } from "./enviroment.js";
import express from "express";

// Hằng số để dịch các tên tài nguyên từ database ra Tiếng Việt
const rssTranslate = {
    "BLUE": "Rương xanh dương/ Blue Chest",
    "GREEN": "Rương xanh lá/ Green Chest",
    "GOLD": "Rương vàng/ Gold Chest",
    "DUNGEON": "Group Dungeon = maptier",
    "ROCK": "Đá/ Stone",
    "LOGS": "Gỗ/ Logs",
    "IRON": "Quặng/ Ore",
    "HIRE": "Da/ Hide",
    "COTTON": "Bông/ Cloth",
};

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Con chào bố hiếu');
});

app.listen(PORT, () => {
    console.log(`Server chạy tại ${PORT}`);
});
// Khởi tạo Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// Hàm tìm và trả về thông tin map
async function checkResources(mapName) {
    // Chỉ cần tìm document, không cần xử lý đếm ở đây
    const doc = await Map.findOne(
        { name: { $regex: new RegExp(`^${mapName}$`, 'i') } },
        { _id: 0, __v: 0 }
    );
    return doc;
}

// Hàm tìm các map có tên gần đúng
async function findMaps(query) {
    if (!query) return [];
    const maps = await Map.find(
        { name: { $regex: new RegExp(query, 'i') } },
        { _id: 0, __v: 0 }
    ).limit(25);
    return maps.map(map => ({ name: map.name, value: map.name }));
}

// Khi bot đã sẵn sàng
client.on("ready", async () => {
    console.log(`Bot đã đăng nhập với tên: ${client.user.tag}`);
    try {
        await connectDB();
        console.log("Kết nối MongoDB thành công.");
    } catch (error) {
        console.error("Lỗi khi kết nối MongoDB:", error);
    }
});

// Xử lý các tương tác
client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
        const focusedValue = interaction.options.getFocused();
        try {
            const choices = await findMaps(focusedValue);
            await interaction.respond(choices);
        } catch (error) {
            console.error('Lỗi khi xử lý autocomplete:', error);
        }
    }

    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "checkavalonmap") {
            await interaction.deferReply();
            const mapName = interaction.options.getString("mapname");
            try {
                const doc = await checkResources(mapName);
                if (!doc) {
                    return interaction.editReply(`Không tìm thấy bản đồ "${mapName}".`);
                }

                // Sửa: Xử lý đếm và badge tại đây
                const resourceList = doc.icons.map(icon => {
                    const translatedName = rssTranslate[icon.alt] || icon.alt;
                    // Kiểm tra và hiển thị badge nếu có
                    if (icon.badge) {
                        return `• ${translatedName} x${icon.badge}`;
                    } else {
                        return `• ${translatedName}`;
                    }
                }).join("\n");

                const embed = new EmbedBuilder()
                    .setTitle(`Thông tin bản đồ Avalon: ${doc.name}`)
                    .setColor(0x0099FF)
                    .addFields(
                        { name: 'Tier', value: `T${doc.tier}`, inline: true },
                        { name: 'Tài nguyên', value: resourceList, inline: false }
                    )
                    .setTimestamp();
                interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error("Lỗi khi xử lý lệnh:", error);
                interaction.editReply("Đã xảy ra lỗi khi truy vấn dữ liệu.");
            }
        }
    }
});

client.login(DC_TOKEN);