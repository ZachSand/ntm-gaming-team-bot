export interface OpenSeaAssetCollectionPage {
  assets: AssetElement[];
}

export interface AssetElement {
  id: number;
  token_id: string;
  num_sales: number;
  background_color: null;
  image_url: string;
  image_preview_url: string;
  image_thumbnail_url: string;
  image_original_url: string;
  animation_url: null;
  animation_original_url: null;
  name: string;
  description: string;
  external_link: null;
  asset_contract: AssetContract;
  permalink: string;
  collection: Collection;
  decimals: null;
  token_metadata: string;
  owner: Owner;
  sell_orders: SellOrder[] | null;
  creator: null;
  traits: Trait[];
  last_sale: LastSale | null;
  top_bid: null;
  listing_date: null;
  is_presale: boolean;
  transfer_fee_payment_token: null;
  transfer_fee: null;
}

export interface AssetContract {
  address: string;
  asset_contract_type: string;
  created_date: Date;
  name: string;
  nft_version: null;
  opensea_version: null;
  owner: number;
  schema_name: string;
  symbol: string;
  total_supply: null;
  description: string;
  external_link: string;
  image_url: string;
  default_to_fiat: boolean;
  dev_buyer_fee_basis_points: number;
  dev_seller_fee_basis_points: number;
  only_proxied_transfers: boolean;
  opensea_buyer_fee_basis_points: number;
  opensea_seller_fee_basis_points: number;
  buyer_fee_basis_points: number;
  seller_fee_basis_points: number;
  payout_address: string;
}

export interface Collection {
  banner_image_url: null;
  chat_url: null;
  created_date: Date;
  default_to_fiat: boolean;
  description: string;
  dev_buyer_fee_basis_points: string;
  dev_seller_fee_basis_points: string;
  discord_url: null;
  display_data: DisplayData;
  external_url: string;
  featured: boolean;
  featured_image_url: null;
  hidden: boolean;
  safelist_request_status: string;
  image_url: string;
  is_subject_to_whitelist: boolean;
  large_image_url: string;
  medium_username: string;
  name: string;
  only_proxied_transfers: boolean;
  opensea_buyer_fee_basis_points: string;
  opensea_seller_fee_basis_points: string;
  payout_address: string;
  require_email: boolean;
  short_description: null;
  slug: string;
  telegram_url: string;
  twitter_username: string;
  instagram_username: null;
  wiki_url: null;
}

export interface DisplayData {
  card_display_style: string;
}

export interface LastSale {
  asset: LastSaleAsset;
  asset_bundle: null;
  event_type: string;
  event_timestamp: Date;
  auction_type: null;
  total_price: string;
  payment_token: PaymentToken;
  transaction: Transaction;
  created_date: Date;
  quantity: string;
}

export interface LastSaleAsset {
  token_id: string;
  decimals: null;
}

export interface PaymentToken {
  id: number;
  symbol: string;
  address: string;
  image_url: string;
  name: string;
  decimals: number;
  eth_price: string;
  usd_price: string;
}

export interface Transaction {
  block_hash: string;
  block_number: string;
  from_account: Owner;
  id: number;
  timestamp: Date;
  to_account: Owner;
  transaction_hash: string;
  transaction_index: string;
}

export interface Owner {
  user: User | null;
  profile_img_url: string;
  address: string;
  config: string;
}

export interface User {
  username: null | string;
}

export interface SellOrder {
  created_date: Date;
  closing_date: Date;
  closing_extendable: boolean;
  expiration_time: number;
  listing_time: number;
  order_hash: string;
  metadata: Metadata;
  exchange: string;
  maker: FeeRecipient;
  taker: FeeRecipient;
  current_price: string;
  current_bounty: string;
  bounty_multiple: string;
  maker_relayer_fee: string;
  taker_relayer_fee: string;
  maker_protocol_fee: string;
  taker_protocol_fee: string;
  maker_referrer_fee: string;
  fee_recipient: FeeRecipient;
  fee_method: number;
  side: number;
  sale_kind: number;
  target: string;
  how_to_call: number;
  calldata: string;
  replacement_pattern: string;
  static_target: string;
  static_extradata: string;
  payment_token: string;
  payment_token_contract: PaymentToken;
  base_price: string;
  extra: string;
  quantity: string;
  salt: string;
  v: number;
  r: string;
  s: string;
  approved_on_chain: boolean;
  cancelled: boolean;
  finalized: boolean;
  marked_invalid: boolean;
  prefixed_hash: string;
}

export interface FeeRecipient {
  user: number;
  profile_img_url: string;
  address: string;
  config: string;
}

export interface Metadata {
  asset: MetadataAsset;
  schema: string;
}

export interface MetadataAsset {
  id: string;
  address: string;
  quantity: string;
}

export interface Trait {
  trait_type: string;
  value: string;
  display_type: null;
  max_value: null;
  trait_count: number;
  order: null;
}
