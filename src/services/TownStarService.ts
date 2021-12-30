import axios, { AxiosError, AxiosResponse } from 'axios';
import { TownStarLeaderboardUser } from '../types/tsLeaderboardUser.js';
import logger from '../configs/logger.js';
import { TownStarCraft, TownStarCraftData } from '../types/townStartCraft.js';

let sessionId = '123456789ABC';

// Things that are usually obtained passively to not include in the craft results by default
const passiveCrafts = ['Energy', 'Water_Drum', 'Crude_Oil', 'Water'];

async function authenticateSession(): Promise<void> {
  sessionId = (Math.random() + 1).toString(36).substring(2);

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
            craftFragment.charAt(0).toUpperCase() + craftFragment.toLowerCase().substring(1, craft.length),
        )
        .join('_')
        .trim()
    : craftName;

  if (!townStarCraftData[craftName]) {
    logger.warn(`Unable to find ${craftName} in TownStarCraftData`);
  }

  return getChildCrafts(craftName, townStarCraftData, new Map(), 1);
};
