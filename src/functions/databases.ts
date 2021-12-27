import { JSONFile, Low } from 'lowdb';
import CONFIG from '../configs/config.js';
import { OpenSeaAsset } from '../types/openSeaAsset.js';

type Data = {
  osAssets: OpenSeaAsset[];
};
const adapter = new JSONFile<Data>(CONFIG.databases.osAssets);
const db = new Low<Data>(adapter);

export const loadDb = async (): Promise<void> => {
  await db.read();
};

export const writeOpenSeaAsset = async (asset: OpenSeaAsset): Promise<void> => {
  if (db.data) {
    const existingOsAsset = db.data.osAssets.find((osAsset) => osAsset.tokenId === asset.tokenId);
    if (!existingOsAsset) {
      db.data.osAssets.push(asset);
      await db.write();
    }
  }
};

export const getOpenSeaAssetByNameAndCollection = (
  assetName: string,
  collectionSlug: string,
): OpenSeaAsset | undefined => {
  if (db.data) {
    return db.data.osAssets.find((osAsset) => osAsset.name === assetName && osAsset.collection === collectionSlug);
  }
  return undefined;
};
