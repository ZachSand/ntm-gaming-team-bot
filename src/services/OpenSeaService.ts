import axios, { AxiosError, AxiosResponse } from 'axios';
import { OpenSeaAsset } from '../types/openSeaAsset.js';
import { AssetElement, OpenSeaAssetCollectionPage } from '../types/openSeaAssetCollectionPageResponse.js';
import { getOpenSeaAssetByNameAndCollection, writeOpenSeaAsset } from '../functions/databases.js';
import { OpenSeaAssetResponse } from '../types/openSeaAssetResponse.js';
import logger from '../configs/logger';

const GALA_CONTRACT_ADDRESS = '0xc36cf0cfcb5d905b8b513860db0cfe63f6cf9f5c';
const OS_ASSET_URI = 'https://api.opensea.io/api/v1/assets';
const OS_ASSET_PAGE_LIMIT = 50;
const OS_ASSET_TOTAL_LIMIT = 1000;

async function getOpenSeaAssetPage(collection: string, offset: number): Promise<OpenSeaAsset[] | undefined> {
  return axios
    .get<OpenSeaAssetCollectionPage>(OS_ASSET_URI, {
      params: {
        asset_contract_address: GALA_CONTRACT_ADDRESS,
        offset,
        limit: OS_ASSET_PAGE_LIMIT,
        collection,
      },
    })
    .then((response: AxiosResponse<OpenSeaAssetCollectionPage>) => {
      if (response.data.assets.length > 1) {
        return response.data.assets.map(
          (asset: AssetElement) =>
            <OpenSeaAsset>{
              tokenId: asset.token_id,
              name: asset.name,
              contractAddress: GALA_CONTRACT_ADDRESS,
              collection,
            },
        );
      }
      return undefined;
    })
    .catch((error: Error | AxiosError) => {
      logger.error(error);
      return undefined;
    });
}

async function getOpenSeaAssetData(osAsset: OpenSeaAsset): Promise<OpenSeaAssetResponse | undefined> {
  return axios
    .get<OpenSeaAssetResponse>(`https://api.opensea.io/api/v1/asset/${osAsset.contractAddress}/${osAsset.tokenId}`)
    .then((response: AxiosResponse<OpenSeaAssetResponse>) => response.data)
    .catch((error: Error | AxiosError) => {
      logger.error(error);
      return undefined;
    });
}

export const getOpenSeaAsset = async (
  collection: string,
  assetName: string,
): Promise<OpenSeaAssetResponse | undefined> => {
  let asset: OpenSeaAsset | undefined = getOpenSeaAssetByNameAndCollection(assetName, collection);
  if (asset) {
    return getOpenSeaAssetData(asset);
  }

  for (let pageNum = 0; pageNum < OS_ASSET_TOTAL_LIMIT / OS_ASSET_PAGE_LIMIT; pageNum += 1) {
    getOpenSeaAssetPage(collection, pageNum * OS_ASSET_PAGE_LIMIT).then((osAssetPage) => {
      if (osAssetPage) {
        osAssetPage.forEach((osAsset) => writeOpenSeaAsset(osAsset));
      }
    });
  }

  asset = getOpenSeaAssetByNameAndCollection(assetName, collection);
  if (asset) {
    return getOpenSeaAssetData(asset);
  }

  return undefined;
};

export default getOpenSeaAsset;
