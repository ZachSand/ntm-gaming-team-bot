import { MessageEmbed } from 'discord.js';
import { OpenSeaAssetResponse, Order } from '../types/openSeaAssetResponse.js';

const BUYER_SIDE = 0;
const SELLER_SIDE = 1;

function buildOpenSeaEmbedMessage(osAssetResponse: OpenSeaAssetResponse): MessageEmbed {
  let assetData = osAssetResponse.orders.filter((order: Order) => order.side === SELLER_SIDE);
  const isCurrentlyListed = assetData.length > 0;

  if (!isCurrentlyListed) {
    assetData = osAssetResponse.orders.filter((order: Order) => order.side === BUYER_SIDE);
  }

  if (!assetData) {
    return new MessageEmbed().setDescription(`No listings or offers found for ${osAssetResponse.name}`);
  }

  const currentAssetData = assetData.reduce((prev: Order, current: Order) =>
    (parseFloat(prev.current_price) / 10 ** prev.payment_token_contract.decimals) *
      parseFloat(prev.payment_token_contract.eth_price) <
    (parseFloat(current.current_price) / 10 ** current.payment_token_contract.decimals) *
      parseFloat(current.payment_token_contract.eth_price)
      ? prev
      : current,
  );
  return new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`OpenSea ${osAssetResponse.collection.name} Asset: ${osAssetResponse.name}`)
    .setDescription(`Information from OpenSea for ${osAssetResponse.name}`)
    .setImage(osAssetResponse.image_url)
    .setURL(osAssetResponse.permalink)
    .addFields(
      {
        name: 'Name',
        value: osAssetResponse.name,
      },
      {
        name: 'Description',
        value: osAssetResponse.description,
      },
      {
        name: isCurrentlyListed ? 'Listing Price: ' : 'Highest Offer Price: ',
        value: `${
          parseFloat(currentAssetData.current_price) / 10 ** currentAssetData.payment_token_contract.decimals
        } ${currentAssetData.payment_token_contract.symbol}`,
      },
      {
        name: 'Last sale price',
        value: osAssetResponse.last_sale
          ? `${
              parseFloat(osAssetResponse.last_sale.total_price) / 10 ** osAssetResponse.last_sale.payment_token.decimals
            } ${osAssetResponse.last_sale.payment_token.symbol}`
          : 'No sale data available',
      },
    )
    .setTimestamp()
    .setFooter('NTM Discord Bot');
}

export default buildOpenSeaEmbedMessage;
