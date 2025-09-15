// bot.js

import mongoose from "mongoose";
import connectDB from "./db.js";
import Map from "./map.schema.js";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { DC_TOKEN, DB_URL } from "./enviroment.js";

const rssTranslate = {
    "BLUE": "Rương xanh dương/ Blue chest",
    "GREEN": "Rương xanh lá/ Green chest",
    "GOLD": "Rương vàng/ Gold chest",
    "DUNGEON": "Dungeon group",
    "ROCK": "Đá/ Stone",
    "LOGS": "Gỗ/ Wood",
    "IRON": "Quặng/ ore",
    "HIRE": "Da/ hide",
    "COTTON": "Bông/ cloth",
};


const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});


async function checkResources(mapName) {
    const doc = await Map.findOne(
        { name: { $regex: new RegExp(`^${mapName}$`, 'i') } },
        { _id: 0 }
    );
    if (!doc) return null;
    const counts = {};
    doc.icons.forEach(icon => {
        counts[icon] = (counts[icon] || 0) + 1;
    });
    return { name: doc.name, tier: doc.tier, counts: counts };
}


async function findMaps(query) {
    if (!query) return [];
    const maps = await Map.find({ name: { $regex: new RegExp(query, 'i') } }).limit(25);
    return maps.map(map => ({ name: map.name, value: map.name }));
}


client.on("ready", async () => {
    console.log(`Bot đã đăng nhập với tên: ${client.user.tag}`);
    try {
        await connectDB();
        console.log("Kết nối MongoDB thành công.");
    } catch (error) {
        console.error("Lỗi khi kết nối MongoDB:", error);
    }
});


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
                const result = await checkResources(mapName);
                if (!result) {
                    return interaction.editReply(`Viết sai tên rồi "${mapName}".`);
                }

               
                const resourceList = Object.entries(result.counts)
                    .map(([resource, count]) => {
                        const translatedName = rssTranslate[resource] || resource;
                        return `• ${translatedName} x${count}`;
                    })
                    .join("\n");

                const embed = new EmbedBuilder()
                    .setTitle(`Thông tin map Avalon: ${result.name}`) 
                    .setColor(0x0099FF)
                    .addFields(
                        { name: 'Tier', value: `T${result.tier}`, inline: true }, 
                        { name: 'Tài nguyên', value: resourceList, inline: false }
                    )
                    .setTimestamp();
                interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error("Lỗi khi xử lý :", error);
                interaction.editReply("Đã xảy ra lỗi khi truy vấn dữ liệu.");
            }
        }
    }
});

client.login(DC_TOKEN);