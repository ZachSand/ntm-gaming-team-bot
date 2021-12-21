import { bot } from "./discord.js";
import { CONFIG } from "../configs/config.js";

export const launch = async (): Promise<void> => {
	await bot.login(CONFIG.discord.token);
};
