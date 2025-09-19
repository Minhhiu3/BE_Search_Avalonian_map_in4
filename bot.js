import mongoose from "mongoose";
import connectDB from "./db.js";
import Map from "./map.schema.js";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { DC_TOKEN } from "./enviroment.js";
import express from "express";

const rssTranslate = {
  BLUE: "Rương xanh dương / Blue Chest",
  GREEN: "Rương xanh lá / Green Chest",
  GOLD: "Rương vàng / Gold Chest",
  DUNGEON: "Group Dungeon = maptier",
  ROCK: "Đá / Stone",
  LOGS: "Gỗ / Logs",
  IRON: "Quặng / Ore",
  HIRE: "Da / Hide",
  COTTON: "Bông / Cloth",
};

// =======================
// Express keep alive
// =======================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(" Bot is running and server is alive!");
});

app.listen(PORT, () => {
  console.log(` Server chạy tại ${PORT}`);
});

// =======================
// Hàm log tiếng Việt
// =======================
function vietMessage(type, msg, data = null) {
  const prefix = {
    info: "[Thông tin]",
    warn: "[Cảnh báo]",
    error: "[Lỗi]",
    success: "[Thành công]",
  };
  const tag = prefix[type] || "[Log]";
  if (data) {
    console.log(`${tag} ${msg}`, data);
  } else {
    console.log(`${tag} ${msg}`);
  }
}


// =======================
// Discord Bot
// =======================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// check resources
async function checkResources(mapName) {
  return await Map.findOne(
    { name: { $regex: new RegExp(`^${mapName}$`, "i") } },
    { _id: 0, __v: 0 }
  );
}

async function findMaps(query) {
  if (!query) return [];
  const maps = await Map.find(
    { name: { $regex: new RegExp(query, "i") } },
    { _id: 0, __v: 0 }
  ).limit(25);
  return maps.map((map) => ({ name: map.name, value: map.name }));
}

// =======================
// Bot event
// =======================
client.once("clientReady", async () => {
  vietMessage("success", `Bot đã đăng nhập thành công: ${client.user.tag}`);
  try {
    await connectDB();
    vietMessage("success", "Kết nối MongoDB thành công.");
  } catch (err) {
    vietMessage("error", "Lỗi kết nối MongoDB:", err.message);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focusedValue = interaction.options.getFocused();
    try {
      const choices = await findMaps(focusedValue);
      await interaction.respond(choices.slice(0, 25));
    } catch (error) {
      vietMessage("error", "Autocomplete lỗi:", error);
      return interaction.respond([]);
    }
  }

  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "checkavalonmap"
  ) {
    await interaction.deferReply();
    const mapName = interaction.options.getString("mapname");
    try {
      const doc = await checkResources(mapName);
      if (!doc) {
        return interaction.editReply(`Không tìm thấy bản đồ "${mapName}".`);
      }

      const resourceList = doc.icons
        .map((icon) => {
          const translatedName = rssTranslate[icon.alt] || icon.alt;
          return icon.badge
            ? `• ${translatedName} x${icon.badge}`
            : `• ${translatedName}`;
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle(`Thông tin bản đồ Avalon: ${doc.name}`)
        .setColor(0x0099ff)
        .addFields(
          { name: "Tier", value: `T${doc.tier}`, inline: true },
          { name: "Tài nguyên", value: resourceList, inline: false }
        )
        .setTimestamp();

      interaction.editReply({ embeds: [embed] });
    } catch (err) {
      vietMessage("error", "Lỗi khi xử lý command:", err);
      interaction.editReply("Đã xảy ra lỗi khi truy vấn dữ liệu.");
    }
  }
});

// =======================
// Log status bot & DB
// =======================
mongoose.connection.on("disconnected", () => {
  vietMessage("warn", " DB chết cụ r dcm. reconnect sau 5s...");
  setTimeout(connectDB, 5000);
});

client.on("shardDisconnect", (event, shardId) => {
  vietMessage("warn", `Bot (shard ${shardId}) vừa mất kết nối Discord.`, event);
});

client.on("shardReconnecting", (shardId) => {
  vietMessage("info", `Bot (shard ${shardId}) đang cố gắng kết nối lại...`);
});

client.on("shardError", (error, shardId) => {
  vietMessage("error", `Bot (shard ${shardId}) gặp lỗi.`, error);
});

client.on("invalidated", () => {
  vietMessage("error", " Kết nối bot bị vô hiệu hóa! Cần login lại bằng token mới.");
});

// =======================
// Error Handling
// =======================
process.on("unhandledRejection", (reason) => {
  vietMessage("error", "[Unhandled Rejection]", reason);
});

process.on("uncaughtException", (err) => {
  vietMessage("error", "[Uncaught Exception]", err);
});

// =======================
// Start bot
// =======================
client.login(DC_TOKEN);
