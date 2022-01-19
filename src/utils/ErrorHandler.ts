import axios, { AxiosError } from 'axios';
import logger from '../configs/logger';

export const handleAxiosError = (error: Error | AxiosError<any, any>) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      logger.error(error.response.data);
      logger.error(error.response.status);
      logger.error(error.response.headers);
    } else if (error.request) {
      logger.error(error.request);
    } else {
      logger.error(`Error: ${error.message}`);
    }
  } else {
    logger.error(error.name);
    logger.error(error.message);
  }
};

export default handleAxiosError;
