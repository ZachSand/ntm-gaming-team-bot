import bot from './discord.js';
import CONFIG from '../configs/config.js';

const launch = async (): Promise<void> => {
  await bot.login(CONFIG.discord.token);
};

export default launch;
