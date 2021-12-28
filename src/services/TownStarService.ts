import axios, { AxiosError, AxiosResponse } from 'axios';
import { TownStarLeaderboardUser } from '../types/tsLeaderboardUser.js';
import logger from '../configs/logger.js';
import { TownStarCraft, TownStarCraftData } from '../types/townStartCraft.js';

let sessionId = '123456789ABC';

async function authenticateSession(): Promise<void> {
  sessionId = (Math.random() + 1).toString(36).substring(2);
  if (!sessionId) {
    console.error('Missing Town Star session ID from environment');
    return undefined;
  }

  return axios.post(
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
      },
    },
  );
}

export const getTsWeeklyLeaderboard = async (): Promise<TownStarLeaderboardUser[] | undefined> => {
  // TODO: Don't authenticate with every call
  await authenticateSession();

  return axios
    .get<TownStarLeaderboardUser[]>(
      'https://townstar.sandbox-games.com/api/game/weekly/leader/score?start=1&stop=10000',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-sessionid': sessionId,
        },
      },
    )
    .then((response: AxiosResponse<TownStarLeaderboardUser[]>) => response.data)
    .catch((error: Error | AxiosError) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        authenticateSession();
      }
      logger.error(error);
      return undefined;
    });
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

  if (tsCraft.Req1 !== 'none') {
    const currentCount = metricsMap.get(tsCraft.Req1) || 0;
    metricsMap.set(tsCraft.Req1, currentCount + tsCraft.Value1 * multiplier);
    getChildCrafts(tsCraft.Req1, townStarCraftData, metricsMap, multiplier * tsCraft.Value1);
  }
  if (tsCraft.Req2 !== 'none') {
    const currentCount = metricsMap.get(tsCraft.Req2) || 0;
    metricsMap.set(tsCraft.Req2, currentCount + tsCraft.Value2 * multiplier);
    getChildCrafts(tsCraft.Req2, townStarCraftData, metricsMap, multiplier * tsCraft.Value2);
  }
  if (tsCraft.Req3 !== 'none') {
    const currentCount = metricsMap.get(tsCraft.Req3) || 0;
    metricsMap.set(tsCraft.Req3, currentCount + tsCraft.Value3 * multiplier);
    getChildCrafts(tsCraft.Req3, townStarCraftData, metricsMap, multiplier * tsCraft.Value3);
  }

  return metricsMap;
}

export const getCraftMetrics = async (craft: string): Promise<Map<string, number> | undefined> => {
  const townStarCraftData: TownStarCraftData = await getCraftData();
  logger.info(townStarCraftData);

  if (!townStarCraftData) {
    logger.error('Unable to retrieve TownStarCraftData');
    return undefined;
  }

  if (!townStarCraftData[craft]) {
    logger.warn(`Unable to find ${craft} in TownStarCraftData`);
  }

  return getChildCrafts(craft, townStarCraftData, new Map(), 1);
};
