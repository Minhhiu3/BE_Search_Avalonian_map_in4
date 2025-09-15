// deploy-commands.js

import { SlashCommandBuilder } from "@discordjs/builders";
import { REST, Routes } from "discord.js";
import { DC_TOKEN, CLIENT_ID } from "./enviroment.js";

const commands = [
    new SlashCommandBuilder()
        .setName("checkavalonmap")
        .setDescription("Kiểm tra tài nguyên bên trong map Avalon")
        .addStringOption(option =>
            option.setName("mapname")
                .setDescription("Tên map (ví dụ: Casos-Aiagsum)")
                .setRequired(true)
                .setAutocomplete(true) // <--- Thêm dòng này
        ),
];

const rest = new REST({ version: '10' }).setToken(DC_TOKEN);

(async () => {
    try {
        console.log("Đang đăng ký lệnh...");
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        console.log("Đăng ký lệnh thành công!");
    } catch (error) {
        console.error("Lỗi khi đăng ký lệnh:", error);
    }
})();