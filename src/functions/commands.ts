import { Message } from 'discord.js';
import _ from 'lodash';
import bot from './discord.js';
import buildOpenSeaEmbedMessage from '../services/OpenSeaMessageService.js';
import { getCraftMetrics, getTsWeeklyLeaderboard } from '../services/TownStarService.js';
import {
  buildTownStarCraftMetricsMessage,
  buildTownStarWeeklyLeaderboardEmbed,
} from '../services/TownStarMessageService.js';
import { OpenSeaAssetResponse } from '../types/openSeaAssetResponse.js';
import getOpenSeaAsset from '../services/OpenSeaService.js';
import logger from '../configs/logger.js';
import { TownStarLeaderboardUser } from '../types/tsLeaderboardUser';

const COMMANDS = {
  TOWN_STAR_WEEKLY: '!tsweekly',
  TOWN_STAR_CRAFT: '!tscraft',
  OPEN_SEA_TOWN_STAR: '!os-town-star',
  OPEN_SEA_MIRANDUS: '!os-mirandus',
  OPEN_SEA_SPIDER_TANKS: '!os-spider-tanks',
  OPEN_SEA_VOX: '!os-collectvox',
  OPEN_SEA_MIRANDUS_VOX: '!os-collectvoxmirandus',
  BOT_HELP: '!bot-commands',
};

const GALA_OPEN_SEA_COLLECTION = {
  TOWN_STAR: 'town-star',
  MIRANDUS: 'mirandus',
  SPIDER_TANKS: 'spider-tanks',
  VOX: 'collectvox',
  MIRANDUS_VOX: 'collectvoxmirandus',
};

const GALA_CONTRACT_ADDRESS = '0xc36cf0cfcb5d905b8b513860db0cfe63f6cf9f5c';
const COLLECT_VOX_CONTRACT_ADDRESS = '0xad9fd7cb4fc7a0fbce08d64068f60cbde22ed34c';
const COLLECT_MIRANDUS_VOX_CONTRACT_ADDRESS = '0xf76179bb0924ba7da8e7b7fc2779495d7a7939d8';

const MAX_TS_CRAFT_AMOUNT = 1000;

function handleBotHelp(ctx: Message) {
  ctx.channel
    .send(
      '**Supported Bot Commands**:\n\n' +
        '**Town Star Weekly**\n\n' +
        `**\`${COMMANDS.TOWN_STAR_WEEKLY} searchTerm\`**\n*Displays the weekly leaderboard position for all towns with "searchTerm" in it (case insensitive).*\n - Example \`!tsweekly ntm\`\n\n` +
        `**\`${COMMANDS.TOWN_STAR_CRAFT} craftName totalAmount(optional)\`**\n*Displays the materials needed to craft "craftName" a "totalAmount" of times.` +
        ` Total amount must not exceed ${MAX_TS_CRAFT_AMOUNT} and is not a required parameter.*\n` +
        ` - Example \`${COMMANDS.TOWN_STAR_CRAFT} uniforms\` or \`${COMMANDS.TOWN_STAR_CRAFT} candy canes 150\` or \`${COMMANDS.TOWN_STAR_CRAFT} Blue_Steel 5\`\n\n` +
        '**Open Sea**\n\n' +
        `**\`os-(collection-name) NFT Name\`**\n*Displays the OpenSea information for an item in the "collection-name" collection on OpenSea. ` +
        `Name must match the exact name in OpenSea.*\n - Example, \`${COMMANDS.OPEN_SEA_TOWN_STAR} Wheat Stand\`\n\n` +
        `**Supported Collections**: ${Object.values(GALA_OPEN_SEA_COLLECTION).join(', ')}\n\n` +
        "**NOTE**: Some of Gala's OpenSea collections are mixed up. For instance, the town-star collection has the Santa's Slay tanks for Spider Tanks\n\n" +
        '**Bot Help**\n\n' +
        `**\`${COMMANDS.BOT_HELP}\`**\n*Displays this command help message*`,
    )
    .catch((error: any) => {
      logger.error(error.name);
      logger.error(error.message);
    });
}

function parseTownStarLeaderboardCommand(content: string): string | undefined {
  const townStarWeeklyCommand = content.trim().split('!tsweekly');
  if (townStarWeeklyCommand && townStarWeeklyCommand.length > 1 && townStarWeeklyCommand[1]) {
    return townStarWeeklyCommand[1];
  }
  return undefined;
}

async function replyTownStartWeekly(ctx: Message) {
  const searchTerm = parseTownStarLeaderboardCommand(ctx.content);
  if (!searchTerm) {
    ctx.channel.send(`Unable to parse searchTerm from \`${ctx.content}\` for TownStar Weekly Leaderboard`);
    return;
  }

  const tsLeaderboardUsers = await getTsWeeklyLeaderboard();
  if (!tsLeaderboardUsers) {
    ctx.channel.send(
      'Unable to retrieve weekly leaderboard. The Town Star server may be down or the bot session may need to reauthenticate. Please try again later',
    );
    return;
  }

  const tsLeaderboardSearchedUsers = tsLeaderboardUsers.filter(
    (user) => user.name && user.name.toUpperCase().trim().includes(searchTerm.toUpperCase().trim()),
  );
  if (!tsLeaderboardSearchedUsers || !tsLeaderboardSearchedUsers.length) {
    ctx.channel.send(`There were no users on the leaderboard found with ${searchTerm.trim()} used in their town name`);
    return;
  }

  ctx.channel.send({
    embeds: _.chunk(tsLeaderboardSearchedUsers, 20).map(
      (pagedResults: TownStarLeaderboardUser[], currentPage: number, leaderBoard: TownStarLeaderboardUser[][]) =>
        buildTownStarWeeklyLeaderboardEmbed(searchTerm, pagedResults, currentPage + 1, leaderBoard.length),
    ),
  });
}

function parseOpenSeaCollection(command: string): string | undefined {
  const supportedOpenSeaCollections = Object.values(GALA_OPEN_SEA_COLLECTION);
  const osMessage = command.split(`!os-`);
  let collection: string | undefined;
  if (osMessage && osMessage.length > 0 && osMessage[1]) {
    const osMessageFragment = osMessage[1].split(' ');
    if (osMessageFragment && osMessageFragment.length > 0 && osMessageFragment[0]) {
      [collection] = osMessageFragment;
    }
  }

  if (collection && supportedOpenSeaCollections.includes(collection)) {
    return supportedOpenSeaCollections[supportedOpenSeaCollections.indexOf(collection)];
  }
  return undefined;
}

function parseOpenSeaAssetName(content: string, collection: string): string | undefined {
  const osMessage = content.split(`!os-${collection}`);
  if (osMessage && osMessage.length > 1 && osMessage[1]) {
    return osMessage[1].trim();
  }
  return undefined;
}

async function handleOpenSeaMessage(ctx: Message) {
  const collection = parseOpenSeaCollection(ctx.content);
  if (!collection) {
    ctx.channel.send(`${ctx.content} is not a supported OpenSea Collection for this bot.`).catch((error: any) => {
      logger.error(error.name);
      logger.error(error.message);
    });
    return;
  }

  const assetName = parseOpenSeaAssetName(ctx.content, collection);
  if (!assetName) {
    ctx.channel.send(`${ctx.content} is not a supported OpenSea asset name for this bot`).catch((error: any) => {
      logger.error(error.name);
      logger.error(error.message);
    });
    return;
  }

  let contractAddress = GALA_CONTRACT_ADDRESS;
  if (collection === GALA_OPEN_SEA_COLLECTION.VOX) {
    contractAddress = COLLECT_VOX_CONTRACT_ADDRESS;
  }
  if (collection === GALA_OPEN_SEA_COLLECTION.MIRANDUS_VOX) {
    contractAddress = COLLECT_MIRANDUS_VOX_CONTRACT_ADDRESS;
  }

  await getOpenSeaAsset(contractAddress, collection, assetName).then((osAsset: OpenSeaAssetResponse | undefined) => {
    if (osAsset) {
      ctx.channel.send({ embeds: [buildOpenSeaEmbedMessage(osAsset)] }).catch((error: any) => {
        logger.error(error.name);
        logger.error(error.message);
      });
    } else {
      ctx.channel.send(`Unable to retrieve OpenSea asset ${assetName}`);
    }
  });
}

function parseCraftName(content: string): string | undefined {
  const craftName = content.split(' ');
  if (craftName && craftName.length > 1 && craftName[1]) {
    return craftName
      .slice(1)
      .map((craftNameFragment: string) => (Number.isNaN(parseFloat(craftNameFragment)) ? craftNameFragment : ''))
      .join(' ')
      .trim();
  }
  return undefined;
}

function parseCraftAmount(content: string): number | undefined {
  const craftAmount = content.split(' ');
  if (craftAmount && craftAmount.length > 1 && craftAmount[craftAmount.length - 1]) {
    const totalAmount = craftAmount[craftAmount.length - 1] || '1';
    return Number.isNaN(totalAmount) ? 1 : parseInt(totalAmount, 10);
  }
  return undefined;
}

function handleTownStarCraft(ctx: Message) {
  const craftName = parseCraftName(ctx.content);
  if (!craftName) {
    ctx.channel.send(`${ctx.content} is not a validly formed Town Star craft command`).catch((error: any) => {
      logger.error(error.name);
      logger.error(error.message);
    });
    return;
  }

  let craftAmount: number = parseCraftAmount(ctx.content) || 1;
  if (craftAmount > MAX_TS_CRAFT_AMOUNT) {
    craftAmount = MAX_TS_CRAFT_AMOUNT;
  }

  getCraftMetrics(craftName).then((craftMetrics: Map<string, number> | undefined) => {
    if (craftMetrics) {
      ctx.channel.send({ embeds: [buildTownStarCraftMetricsMessage(craftName, craftMetrics, craftAmount)] });
    } else {
      ctx.channel.send('Unable to generate craft data');
    }
  });
}

const messageListener = () => {
  bot.on('messageCreate', async (ctx: Message) => {
    if (!ctx.author.bot) {
      const caseInsensitiveContent = ctx.content.toUpperCase().trim();
      if (caseInsensitiveContent.includes(COMMANDS.TOWN_STAR_WEEKLY.toUpperCase())) {
        await replyTownStartWeekly(ctx);
      }
      if (caseInsensitiveContent.includes('!os-'.toUpperCase())) {
        await handleOpenSeaMessage(ctx);
      }
      if (caseInsensitiveContent.includes(COMMANDS.BOT_HELP.toUpperCase())) {
        handleBotHelp(ctx);
      }
      if (caseInsensitiveContent.includes(COMMANDS.TOWN_STAR_CRAFT.toUpperCase())) {
        handleTownStarCraft(ctx);
      }
    }
  });
};

export default messageListener;
