import { JSONFile, Low } from 'lowdb';
import CONFIG from '../configs/config.js';
import { OpenSeaAsset } from '../types/openSeaAsset.js';
import logger from '../configs/logger.js';
import { TownStarCraftData } from '../types/townStartCraft.js';

type Data = {
  osAssets: OpenSeaAsset[];
  tsCraftData: TownStarCraftData;
};
const adapter = new JSONFile<Data>(CONFIG.databases.osAssets);
const db = new Low<Data>(adapter);

export const loadDb = async (): Promise<void> => {
  await db.read();
};

export const writeOpenSeaAsset = async (asset: OpenSeaAsset): Promise<void> => {
  if (db.data) {
    const existingOsAsset = db.data.osAssets.find(
      (osAsset) => osAsset.tokenId === asset.tokenId && osAsset.contractAddress === asset.contractAddress,
    );
    if (!existingOsAsset) {
      logger.debug(`Writing OS Asset: ${asset.name} from collection ${asset.collection}`);
      db.data.osAssets.push(asset);
      await db.write();
    }
  }
};

export const getOpenSeaAssetByNameAndCollection = (assetName: string, collection: string): OpenSeaAsset | undefined => {
  if (db.data) {
    return db.data.osAssets.find((osAsset) => osAsset.name === assetName && osAsset.collection === collection);
  }
  return undefined;
};

export const writeTownStarCraftData = async (craftData: TownStarCraftData): Promise<void> => {
  if (db.data) {
    db.data.tsCraftData = craftData;
    await db.write();
  }
};

export const getTownStarCraftData = (): TownStarCraftData | undefined => {
  if (db.data) {
    return db.data.tsCraftData;
  }
  return undefined;
};
