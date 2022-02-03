import axios, { AxiosError, AxiosResponse } from 'axios';
import pThrottle from 'p-throttle';
import { OpenSeaAsset } from '../types/openSeaAsset.js';
import { AssetElement, OpenSeaAssetCollectionPage } from '../types/openSeaAssetCollectionPageResponse.js';
import { getOpenSeaAssetByNameAndCollection, writeOpenSeaAsset } from '../functions/databases.js';
import { OpenSeaAssetResponse } from '../types/openSeaAssetResponse.js';
import handleAxiosError from '../utils/ErrorHandler.js';

const OS_ASSETS_URI = 'https://api.opensea.io/api/v1/assets';
const OS_ASSET_BASE_URI = 'https://api.opensea.io/api/v1/asset';
const OS_ASSET_PAGE_LIMIT = 50;
const OS_ASSET_TOTAL_LIMIT = 9000;

const OS_API_HEADERS = {
  'X-API-KEY': process.env.OPENSEA_API_KEY || '',
};

/*
 * Throttle request to only allow 2 every 5 seconds - OpenSea really likes to return 429 on requests
 * For a collection of 8888 this will make retrieving them all take 8888/50/2 * 5 seconds => ~7 minutes
 * Ideally only used to cache the data in the lowdb JSON persisted file, shouldn't be used when the bot is
 * running live. Needs reworking. 
 */
const throttle = pThrottle({
  limit: 2,
  interval: 5,
});

async function getOpenSeaAssetPage(
  collectionContractAddress: string,
  collection: string,
  offset: number,
): Promise<OpenSeaAsset[] | undefined> {
  return axios
    .get<OpenSeaAssetCollectionPage>(OS_ASSETS_URI, {
      headers: OS_API_HEADERS,
      params: {
        asset_contract_address: collectionContractAddress,
        offset,
        limit: OS_ASSET_PAGE_LIMIT,
        collection,
      },
    })
    .then((response: AxiosResponse<OpenSeaAssetCollectionPage>) => {
      if (response.data.assets && response.data.assets.length > 1) {
        return response.data.assets.map(
          (asset: AssetElement) =>
            <OpenSeaAsset>{
              tokenId: asset.token_id,
              name: asset.name,
              contractAddress: collectionContractAddress,
              collection,
            },
        );
      }
      return undefined;
    })
    .catch((error: Error | AxiosError) => {
      handleAxiosError(error);
      return undefined;
    });
}

async function getOpenSeaAssetData(osAsset: OpenSeaAsset): Promise<OpenSeaAssetResponse | undefined> {
  return axios
    .get<OpenSeaAssetResponse>(`${OS_ASSET_BASE_URI}/${osAsset.contractAddress}/${osAsset.tokenId}`, {
      headers: OS_API_HEADERS,
      params: { format: 'json' },
    })
    .then((response: AxiosResponse<OpenSeaAssetResponse>) => response.data)
    .catch((error: Error | AxiosError) => {
      handleAxiosError(error);
      return undefined;
    });
}

export const getOpenSeaAsset = async (
  contractAddress: string,
  collection: string,
  assetName: string,
): Promise<OpenSeaAssetResponse | undefined> => {
  /* See if the database already has the asset information, if so then return the asset */
  let asset: OpenSeaAsset | undefined = getOpenSeaAssetByNameAndCollection(assetName.trim(), collection);
  if (asset) {
    return getOpenSeaAssetData(asset);
  }

  /* It takes too long to look through OpenSea for VOX since there are 8888 and OpenSea rate limits a lot, just return immediately if it isn't cached
   * when we're in the production environment  */
  if (!asset && collection.includes('vox') && process.env.NODE_ENV === 'production') {
    return undefined;
  }

  /* If the database doesn't have the asset, cache all assets from the collection in the database */
  const throttledOpenSeaRequests = throttle(async (pageIndex: number) =>
    getOpenSeaAssetPage(contractAddress, collection, pageIndex),
  );

  for (let pageOffset = 0; pageOffset < OS_ASSET_TOTAL_LIMIT; pageOffset += OS_ASSET_PAGE_LIMIT) {
    // eslint-disable-next-line no-await-in-loop
    await (async () => {
      await throttledOpenSeaRequests(pageOffset).then((osAssetPage: OpenSeaAsset[] | undefined) => {
        if (osAssetPage) {
          osAssetPage.forEach((osAsset: OpenSeaAsset) => writeOpenSeaAsset(osAsset));
        }
      });
    })();
  }

  asset = getOpenSeaAssetByNameAndCollection(assetName, collection);
  if (asset) {
    return getOpenSeaAssetData(asset);
  }

  return undefined;
};

export default getOpenSeaAsset;
