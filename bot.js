import mongoose from "mongoose";
import connectDB from "./db.js";
import Map from "./map.schema.js";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { DC_TOKEN } from "./enviroment.js";
import express from "express";

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

// keep alive route
app.get("/", (req, res) => {
  res.send("✅ Bot is running and server is alive!");
});

app.listen(PORT, () => {
  console.log(`Server chạy tại ${PORT}`);
});

// =======================
// Discord Bot
// =======================
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
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

client.on("ready", async () => {
  console.log(`Bot login: ${client.user.tag}`);
  try {
    await connectDB();
    console.log("MongoDB connected.");
  } catch (err) {
    console.error("MongoDB error:", err.message);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const focusedValue = interaction.options.getFocused();
    try {
      const choices = await findMaps(focusedValue);
      await interaction.respond(choices);
    } catch (error) {
      console.error("Autocomplete error:", error);
    }
  }

  if (interaction.isChatInputCommand() && interaction.commandName === "checkavalonmap") {
    await interaction.deferReply();
    const mapName = interaction.options.getString("mapname");
    try {
      const doc = await checkResources(mapName);
      if (!doc) return interaction.editReply(`Không tìm thấy bản đồ "${mapName}".`);

      const resourceList = doc.icons
        .map((icon) => {
          const translatedName = rssTranslate[icon.alt] || icon.alt;
          return icon.badge ? `• ${translatedName} x${icon.badge}` : `• ${translatedName}`;
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
      console.error("Command error:", err);
      interaction.editReply("Đã xảy ra lỗi khi truy vấn dữ liệu.");
    }
  }
});

// =======================
// Auto reconnect logic
// =======================

// Nếu DB mất kết nối → reconnect
mongoose.connection.on("disconnected", () => {
  console.error("Chết cụ db rồi dcm, reconnect...");
  setTimeout(connectDB, 5000);
});

// Nếu bot mất heartbeat → reconnect thay vì kill
let lastHeartbeat = Date.now();
client.ws.on("heartbeat", () => {
  lastHeartbeat = Date.now();
});

setInterval(() => {
  if (Date.now() - lastHeartbeat > 30000) {
    console.error("Bot mất heartbeat. Reconnect...");
    client.destroy();
    client.login(DC_TOKEN);
  }
}, 10000);

// Catch unhandled errors nhưng không kill
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Rejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception]", err);
});

// Start bot
client.login(DC_TOKEN);
