import { Message, MessageEmbed } from 'discord.js';
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

function handleBotHelp(ctx: Message<boolean>) {
  ctx.channel
    .send(
      'Supported Bot Commnds:\n\n' +
        '`!tsweekly searchTerm` - Displays the weekly leaderboard position for all towns with "searchTerm" in it (case insensitive). Example `!tsweekly ntm`\n\n' +
        '`!os-town-star NFT Name` - Displays the OpenSea information for an item in the Town Star collection on OpenSea. ' +
        'Name must match the exact name in OpenSea. Example, `!os-town-star Wheat Stand`\n\n' +
        '`!os-mirandus NFT Name` - Displays the OpenSea information for an item in the Mirandus collection on OpenSea. ' +
        'Name must match the exact name in OpenSea. Example, `!os-mirandus Wharf`\n\n',
    )
    .catch((error: any) => {
      logger.error(error);
    });
}

function parseTownStarLeaderboardCommand(content: string): string | undefined {
  const townStarWeeklyCommand = content.trim().split('!tsweekly');
  if (townStarWeeklyCommand && townStarWeeklyCommand.length > 1 && townStarWeeklyCommand[1]) {
    return townStarWeeklyCommand[1];
  }
  return undefined;
}

async function replyTownStartWeekly(ctx: Message<boolean>) {
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

  const tsLeaderboardSearchedUsers = tsLeaderboardUsers.filter((user) =>
    user.name.toUpperCase().trim().includes(searchTerm.toUpperCase().trim()),
  );
  if (!tsLeaderboardSearchedUsers) {
    ctx.channel.send(`There were no users on the leaderboard found with ${searchTerm} used in their town name`);
    return;
  }

  _.chunk(tsLeaderboardSearchedUsers, 20)
    .map((pagedResults: TownStarLeaderboardUser[], currentPage: number, leaderBoard: TownStarLeaderboardUser[][]) =>
      buildTownStarWeeklyLeaderboardEmbed(searchTerm, pagedResults, currentPage + 1, leaderBoard.length),
    )
    .forEach((embedMessage: MessageEmbed) => ctx.channel.send({ embeds: [embedMessage] }));
}

function parseOpenSeaCollection(command: string): string | undefined {
  if (command && command.includes('!os-town-star')) {
    return 'town-star';
  }
  if (command && command.includes('!os-mirandus')) {
    return 'mirandus';
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

async function handleOpenSeaMessage(ctx: Message<boolean>) {
  const collection = parseOpenSeaCollection(ctx.content);
  if (!collection) {
    ctx.channel.send(`${ctx.content} is not a supported OpenSea Collection for this bot.`).catch((error: any) => {
      logger.error(error);
    });
    return;
  }

  const assetName = parseOpenSeaAssetName(ctx.content, collection);
  if (!assetName) {
    ctx.channel.send(`${ctx.content} is not a supported OpenSea asset name for this bot`).catch((error: any) => {
      logger.error(error);
    });
    return;
  }

  getOpenSeaAsset(collection, assetName).then((osAsset: OpenSeaAssetResponse | undefined) => {
    if (osAsset) {
      ctx.channel.send({ embeds: [buildOpenSeaEmbedMessage(osAsset)] }).catch((error: any) => {
        logger.error(error);
      });
    } else {
      ctx.channel.send(`Unable to retrieve OpenSea asset ${assetName}`);
    }
  });
}

function parseCraftName(content: string): string | undefined {
  const craftName = content.split(`!tscraft`);
  if (craftName && craftName.length > 1 && craftName[1]) {
    return craftName[1].trim();
  }
  return undefined;
}

function handleTownStarCraft(ctx: Message<boolean>) {
  const craft = parseCraftName(ctx.content);
  if (!craft) {
    ctx.channel.send(`${ctx.content} is not a validly formed TownStar craft command`).catch((error: any) => {
      logger.error(error);
    });
    return;
  }

  getCraftMetrics(craft).then((craftMetrics: Map<string, number> | undefined) => {
    if (craftMetrics) {
      ctx.channel.send(buildTownStarCraftMetricsMessage(craftMetrics));
    } else {
      ctx.channel.send('Unable to generate craft data');
    }
  });
}

const messageListener = () => {
  bot.on('messageCreate', async (ctx: Message<boolean>) => {
    if (!ctx.author.bot) {
      const caseInsensitiveContent = ctx.content.toUpperCase().trim();
      if (caseInsensitiveContent.includes('!tsweekly'.toUpperCase())) {
        await replyTownStartWeekly(ctx);
      }
      if (caseInsensitiveContent.includes('!os-'.toUpperCase())) {
        await handleOpenSeaMessage(ctx);
      }
      if (caseInsensitiveContent.includes('!bot-commands'.toUpperCase())) {
        handleBotHelp(ctx);
      }
      if (caseInsensitiveContent.includes('!tscraft'.toUpperCase())) {
        handleTownStarCraft(ctx);
      }
    }
  });
};

export default messageListener;
