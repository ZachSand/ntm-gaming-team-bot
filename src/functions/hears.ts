import { EmbedFieldData, Message, MessageEmbed } from 'discord.js';
import axios from 'axios';
import { OpenSeaAsset } from '../types/openSeaAsset.js';
import { AssetElement, OpenSeaAssetCollectionPage } from '../types/openSeaAssetCollectionPageResponse.js';
import { OpenSeaAssetResponse, Order } from '../types/openSeaAssetResponse.js';
import { TownStarLeaderboardUser } from '../types/tsLeaderboardUser.js';
import bot from './discord.js';
import { getOpenSeaAssetByNameAndCollection, writeOpenSeaAsset } from './databases.js';

const headers = {
  'Content-Type': 'application/json',
  'x-sessionid': '7d04eda24052695d2faba8a7e02b90a81cd0e8fa898b92af',
};

const galaContractAddress = '0xc36cf0cfcb5d905b8b513860db0cfe63f6cf9f5c';
const osAssetPageLimit = 50;
const totalAssetLimit = 1000;

function handleBotHelp(ctx: Message<boolean>) {
  ctx.channel
    .send(
      'Supported Bot Commnds:\n\n' +
        '`!tsweekly` - Displays the weekly leaderboard for users with NTM in their name\n\n' +
        '`!tsweekly name` - Displays the weekly leaderboard position for all towns with name in it. Example `!tsweekly ThirstyGoat`\n\n' +
        '`!tssweekly` - Displays the weekly scholar leaderboard for users with NTM-S in their name\n\n' +
        '`!os-town-star NFT Name` - Displays the OpenSea information for an item in the Town Star collection on OpenSea. ' +
        'Name must match the exact name in OpenSea. Example, `!os-town-star Wheat Stand`\n\n' +
        '`!os-mirandus NFT Name` - Displays the OpenSea information for an item in the Mirandus collection on OpenSea. ' +
        'Name must match the exact name in OpenSea. Example, `!os-mirandus Wharf`\n\n',
    )
    .catch((error: any) => {
      console.error(error);
    });
}

async function getTsWeeklyLeaderboard(): Promise<TownStarLeaderboardUser[] | undefined> {
  try {
    const response = await axios.get<TownStarLeaderboardUser[]>(
      'https://townstar.sandbox-games.com/api/game/weekly/leader/score?start=1&stop=10000',
      {
        headers,
      },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error);
    } else {
      console.error(error);
    }
    return undefined;
  }
}

async function replyTownStartWeekly(ctx: Message<boolean>): Promise<void> {
  const tsLeaderboardUsers = await getTsWeeklyLeaderboard();
  if (!tsLeaderboardUsers) {
    ctx.channel.send('Unable to retrieve weekly leaderboard.');
    return;
  }
  const weeklyMessage = ctx.content.trim().split('!tsweekly');
  if (weeklyMessage && weeklyMessage.length > 1 && weeklyMessage[0] && weeklyMessage[1]) {
    const userName = weeklyMessage[1];
    const tsLeaderboardEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Town Star Weekly Competition')
      .setDescription(`Listing of players for the Town Star Weekly Competition with ${userName} in their name`)
      .addFields(
        tsLeaderboardUsers
          .filter((user) => user.name.toUpperCase().trim().includes(userName.toUpperCase().trim()))
          .map(
            (user) =>
              <EmbedFieldData>{
                name: user.name,
                value: `Rank: ${user.rank} Score: ${user.score}`,
              },
          ),
      )
      .setTimestamp()
      .setFooter('NTM Discord Bot');
    ctx.channel.send({ embeds: [tsLeaderboardEmbed] });
  } else {
    const tsLeaderboardEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('NTM Town Star Weekly Competition')
      .setDescription('Listing of NTM players for the Town Star Weekly Competition')
      .addFields(
        tsLeaderboardUsers
          .filter((user) => user.name.toUpperCase().includes('NTM'))
          .map(
            (user) =>
              <EmbedFieldData>{
                name: user.name,
                value: `Rank: ${user.rank} Score: ${user.score}`,
              },
          ),
      )
      .setTimestamp()
      .setFooter('NTM Discord Bot');
    ctx.channel.send({ embeds: [tsLeaderboardEmbed] });
  }
}

async function replyTownStarWeeklyScholar(ctx: Message<boolean>) {
  const tsLeaderboardUsers = await getTsWeeklyLeaderboard();
  if (!tsLeaderboardUsers) {
    ctx.channel.send('Unable to retrieve weekly leaderboard.');
    return;
  }

  const tsLeaderboardScholarEmbed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle('NTM Town Star Weekly Competition - Scholars')
    .setDescription('Listing of NTM scholars for the Town Star Weekly Competition')
    .addFields(
      tsLeaderboardUsers
        .filter((user) => user.name.toUpperCase().includes('NTM-S'))
        .map(
          (user) =>
            <EmbedFieldData>{
              name: user.name,
              value: `Rank: ${user.rank} Score: ${user.score}`,
            },
        ),
    )
    .setTimestamp()
    .setFooter('NTM Discord Bot');

  ctx.channel.send({ embeds: [tsLeaderboardScholarEmbed] });
}

async function getOpenSeaAssetPage(collectionSlug: string, offset: number): Promise<OpenSeaAsset[] | undefined> {
  try {
    const response = await axios.get<OpenSeaAssetCollectionPage>('https://api.opensea.io/api/v1/assets', {
      params: {
        asset_contract_address: galaContractAddress,
        offset,
        limit: osAssetPageLimit,
        collection: collectionSlug,
      },
    });
    const responseData = response.data;

    if (responseData.assets.length > 1) {
      return responseData.assets.map(
        (asset: AssetElement) =>
          <OpenSeaAsset>{
            tokenId: asset.token_id,
            name: asset.name,
            contractAddress: galaContractAddress,
            collection: collectionSlug,
          },
      );
    }
    console.error('Missing assets from response');
    return undefined;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error);
    } else {
      console.error(error);
    }
    return undefined;
  }
}

async function handleOpenSeaMessage(ctx: Message<boolean>) {
  let collectionSlug;
  if (ctx.content.includes('!os-town-star')) {
    collectionSlug = 'town-star';
  } else if (ctx.content.includes('!os-mirandus')) {
    collectionSlug = 'mirandus';
  } else {
    ctx.channel.send(`${ctx.content} is not supported`).catch((error: any) => {
      console.error(error);
    });
    return;
  }

  const osMessage = ctx.content.split(`!os-${collectionSlug}`);
  if (osMessage && osMessage.length > 1 && osMessage[1]) {
    const assetName = osMessage[1].trim();
    let asset: OpenSeaAsset | undefined = getOpenSeaAssetByNameAndCollection(assetName, collectionSlug);
    if (!asset) {
      for (let i = 0; i < totalAssetLimit / osAssetPageLimit; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const osAssetPage = await getOpenSeaAssetPage(collectionSlug, i * osAssetPageLimit);
        if (osAssetPage) {
          // eslint-disable-next-line no-restricted-syntax
          for (const osAsset of osAssetPage) {
            // eslint-disable-next-line no-await-in-loop
            await writeOpenSeaAsset(osAsset);
            if (osAsset.name.toUpperCase() === assetName.toUpperCase()) {
              asset = osAsset;
              break;
            }
          }
        }
      }
    }
    if (asset) {
      try {
        const response = await axios.get<OpenSeaAssetResponse>(
          `https://api.opensea.io/api/v1/asset/${asset.contractAddress}/${asset.tokenId}`,
        );
        const responseData = response.data;
        const currentListings = responseData.orders.filter((order: Order) => order.side === 1);
        if (!currentListings || currentListings.length < 1) {
          ctx.channel.send(`Unable to find ${asset.name} in OpenSea`).catch((error: any) => {
            console.error(error);
          });
          return;
        }
        const currentListing = currentListings.reduce((prev: Order, current: Order) =>
          (parseFloat(prev.current_price) / 10 ** prev.payment_token_contract.decimals) *
            parseFloat(prev.payment_token_contract.eth_price) <
          (parseFloat(current.current_price) / 10 ** current.payment_token_contract.decimals) *
            parseFloat(current.payment_token_contract.eth_price)
            ? prev
            : current,
        );
        const openSeaAssetEmbed = new MessageEmbed()
          .setColor('#0099ff')
          .setTitle(`OpenSea ${collectionSlug} Asset: ${assetName}`)
          .setDescription(`Information from OpenSea for ${assetName}`)
          .setImage(responseData.image_url)
          .setURL(responseData.permalink)
          .addFields(
            {
              name: 'Name',
              value: responseData.name,
            },
            {
              name: 'Description',
              value: responseData.description,
            },
            {
              name: 'Listing Price: ',
              value: `${
                parseFloat(currentListing.current_price) / 10 ** currentListing.payment_token_contract.decimals
              } ${currentListing.payment_token_contract.symbol}`,
            },
            {
              name: 'Last sale price',
              value: `${
                parseFloat(responseData.last_sale.total_price) / 10 ** responseData.last_sale.payment_token.decimals
              } ${responseData.last_sale.payment_token.symbol}`,
            },
          )
          .setTimestamp()
          .setFooter('NTM Discord Bot');
        ctx.channel.send({ embeds: [openSeaAssetEmbed] }).catch((error: any) => {
          console.error(error);
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(error);
        } else {
          console.error(error);
        }
      }
    } else {
      ctx.channel.send(`Unable to find ${assetName} in OpenSea`).catch((error) => {
        console.error(error);
      });
    }
  } else {
    ctx.channel.send(`Opensea request was malformed`).catch((error) => {
      console.error(error);
    });
  }
}

const text = () => {
  bot.on('messageCreate', async (ctx: Message<boolean>) => {
    if (!ctx.author.bot) {
      if (ctx.content.toUpperCase().trim().includes('!tsweekly'.toUpperCase().trim())) {
        await replyTownStartWeekly(ctx);
      }
      if (ctx.content === '!tssweekly') {
        await replyTownStarWeeklyScholar(ctx);
      }
      if (ctx.content.includes('!os-')) {
        await handleOpenSeaMessage(ctx);
      }
      if (ctx.content.includes('!bot-commands')) {
        handleBotHelp(ctx);
      }
    }
  });
};

export default text;
