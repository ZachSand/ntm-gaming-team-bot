import { OpenSeaAsset } from "../types/osAsset.js";
import { CONFIG } from "../configs/config.js";
import { JSONFile, Low } from "lowdb";

type Data = {
	osAssets: OpenSeaAsset[];
};
const adapter = new JSONFile<Data>(CONFIG.databases.osAssets);
const db = new Low<Data>(adapter);

export const loadDb = async (): Promise<void> => {
	await db.read();
};

export const writeOpenSeaAsset = async (asset: OpenSeaAsset): Promise<void> => {
	const existingOsAsset = db.data.osAssets.find((osAsset) => osAsset.tokenId === asset.tokenId);
	if (!existingOsAsset) {
		db.data.osAssets.push(asset);
		await db.write();
	}
};

export const getOpenSeaAssetByTokenId = async (tokenId: string): Promise<OpenSeaAsset> => {
	return db.data.osAssets.find((osAsset) => osAsset.tokenId === tokenId);
};

export const getOpenSeaAssetByNameAndCollection = async (assetName: string, collectionSlug: string): Promise<OpenSeaAsset> => {
	return db.data.osAssets.find((osAsset) => osAsset.name === assetName && osAsset.collection === collectionSlug);
};
