import bot from './discord.js';

const launch = async (): Promise<void> => {
  await bot.login(process.env.DISCORD_BOT_KEY);
};

export default launch;
