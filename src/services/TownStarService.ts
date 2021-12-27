import axios, { AxiosError, AxiosResponse } from 'axios';
import { TownStarLeaderboardUser } from '../types/tsLeaderboardUser.js';
import logger from '../configs/logger.js';

async function authenticateSession(): Promise<void> {
  const sessionId = process.env.TOWNSTAR_SESSION_ID;
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

async function getTsWeeklyLeaderboard(): Promise<TownStarLeaderboardUser[] | undefined> {
  const sessionId = process.env.TOWNSTAR_SESSION_ID;
  if (!sessionId) {
    console.error('Missing Town Star session ID from environment');
    return undefined;
  }

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
}

export default getTsWeeklyLeaderboard;
