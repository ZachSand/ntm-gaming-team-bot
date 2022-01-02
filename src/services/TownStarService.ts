import axios, { AxiosError, AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import { TownStarLeaderboardUser } from '../types/tsLeaderboardUser.js';
import logger from '../configs/logger.js';
import { TownStarCraft, TownStarCraftData } from '../types/townStartCraft.js';

// Things that are usually obtained passively to not include in the craft results by default
const passiveCrafts = ['Energy', 'Water_Drum', 'Crude_Oil', 'Water'];
let currentSessionId: string;

function generateTownStarSessionId() {
  const buffer = new Uint8Array(24);
  const bytes = crypto.randomBytes(buffer.length);
  buffer.set(bytes);
  return Array.from(buffer)
    .map((t) => t.toString(16).padStart(2, '0'))
    .join('');
}

async function authenticateSession(sessionId: string): Promise<string | undefined> {
  return axios
    .post(
      'https://townstar.sandbox-games.com/api/authenticate',
      {
        userId: null,
        secret: null,
        token: process.env.TOWNSTAR_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-sessionid': sessionId,
          Accept: '*/*',
        },
      },
    )
    .then(() => sessionId)
    .catch((error: Error | AxiosError) => {
      logger.error(error);
      return undefined;
    });
}

function queryTownStarWeeklyLeaderboard(sessionId: string): Promise<TownStarLeaderboardUser[] | undefined> {
  return axios
    .get<TownStarLeaderboardUser[]>(
      'https://townstar.sandbox-games.com/api/game/weekly/leader/score?start=1&stop=10000',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-sessionid': sessionId,
          Accept: '*/*',
        },
      },
    )
    .then((response: AxiosResponse<TownStarLeaderboardUser[]>) => response.data)
    .catch((error: Error | AxiosError) => {
      logger.error(error);
      return undefined;
    });
}

export const getTsWeeklyLeaderboard = async (): Promise<TownStarLeaderboardUser[] | undefined> => {
  if (!currentSessionId) {
    currentSessionId = generateTownStarSessionId();
    logger.warn('Generating a new Town Star session ID for the first time');
    await authenticateSession(currentSessionId);
  }

  let townStarLeaderboardUsers = await queryTownStarWeeklyLeaderboard(currentSessionId);
  if (!townStarLeaderboardUsers) {
    currentSessionId = generateTownStarSessionId();
    logger.error('Generating a new Town Star session ID due to failure retrieving leaderboards');
    await authenticateSession(currentSessionId);
    townStarLeaderboardUsers = await queryTownStarWeeklyLeaderboard(currentSessionId);
  }

  return townStarLeaderboardUsers;
};

function getCraftData(): Promise<TownStarCraftData> {
  return axios
    .get<AxiosResponse<TownStarCraftData>>(
      'https://townstar.sandbox-games.com/launch/files/assets/24578485/1/CraftsData.json',
    )
    .then((response: AxiosResponse) => response.data)
    .catch((error: Error | AxiosError) => {
      logger.error(error);
    });
}

function getChildCrafts(
  craft: string,
  townStarCraftData: TownStarCraftData,
  metricsMap: Map<string, number>,
  multiplier: number,
) {
  const tsCraft: TownStarCraft | undefined = townStarCraftData[craft];

  // If the craft data can't be found or it has no child requirements (e.g. Water)
  if (!tsCraft) {
    return metricsMap;
  }

  [
    [tsCraft.Req1, tsCraft.Value1],
    [tsCraft.Req2, tsCraft.Value2],
    [tsCraft.Req3, tsCraft.Value3],
  ].forEach((craftTuple) => {
    if (craftTuple[0] !== 'none') {
      const craftName: string = <string>craftTuple[0];
      const craftQuantity: number = <number>craftTuple[1];
      const currentCount = metricsMap.get(<string>craftTuple[0]) || 0;

      if (!passiveCrafts.includes(craftName)) {
        metricsMap.set(craftName, currentCount + craftQuantity * multiplier);
        getChildCrafts(craftName, townStarCraftData, metricsMap, multiplier * craftQuantity);
      }
    }
  });

  return metricsMap;
}

export const getCraftMetrics = async (craft: string): Promise<Map<string, number> | undefined> => {
  const townStarCraftData: TownStarCraftData = await getCraftData();

  if (!townStarCraftData) {
    logger.error('Unable to retrieve TownStarCraftData');
    return undefined;
  }

  let craftName = craft.charAt(0).toUpperCase() + craft.toLowerCase().substring(1, craft.length).replace(' ', '_');
  craftName = craftName.includes('_')
    ? craftName
        .split('_')
        .map(
          (craftFragment: string) =>
            craftFragment.charAt(0).toUpperCase() + craftFragment.toLowerCase().substring(1, craftFragment.length),
        )
        .join('_')
        .trim()
    : craftName;

  if (!townStarCraftData[craftName]) {
    logger.warn(`Unable to find ${craftName} in TownStarCraftData`);
  }

  return getChildCrafts(craftName, townStarCraftData, new Map(), 1);
};
