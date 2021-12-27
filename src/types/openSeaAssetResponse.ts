export interface OpenSeaAssetResponse {
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
  owner: Creator;
  sell_orders: null;
  creator: Creator;
  traits: Trait[];
  last_sale: LastSale;
  top_bid: null;
  listing_date: null;
  is_presale: boolean;
  transfer_fee_payment_token: null;
  transfer_fee: null;
  related_assets: any[];
  orders: Order[];
  auctions: any[];
  supports_wyvern: boolean;
  top_ownerships: TopOwnership[];
  ownership: null;
  highest_buyer_commitment: null;
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
  payment_tokens: PaymentTokenElement[];
  primary_asset_contracts: AssetContract[];
  traits: Traits;
  stats: { [key: string]: number };
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

export interface PaymentTokenElement {
  id: number;
  symbol: string;
  address: string;
  image_url: string;
  name: string;
  decimals: number;
  eth_price: number;
  usd_price: number;
}

export interface Traits {
  shareRequirement: ShareRequirement;
}

export interface ShareRequirement {
  min: number;
  max: number;
}

export interface Creator {
  user: User | null;
  profile_img_url: string;
  address: string;
  config: string;
}

export interface User {
  username: null | string;
}

export interface LastSale {
  asset: LastSaleAsset;
  asset_bundle: null;
  event_type: string;
  event_timestamp: Date;
  auction_type: null;
  total_price: string;
  payment_token: PaymentTokenContractClass;
  transaction: Transaction;
  created_date: Date;
  quantity: string;
}

export interface LastSaleAsset {
  token_id: string;
  decimals: null;
}

export interface PaymentTokenContractClass {
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
  from_account: Creator;
  id: number;
  timestamp: Date;
  to_account: Creator;
  transaction_hash: string;
  transaction_index: string;
}

export interface Order {
  created_date: Date;
  closing_date: Date;
  closing_extendable: boolean;
  expiration_time: number;
  listing_time: number;
  order_hash: string;
  metadata: Metadata;
  exchange: string;
  maker: Creator;
  taker: Creator;
  current_price: string;
  current_bounty: string;
  bounty_multiple: string;
  maker_relayer_fee: string;
  taker_relayer_fee: string;
  maker_protocol_fee: string;
  taker_protocol_fee: string;
  maker_referrer_fee: string;
  fee_recipient: Creator;
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
  payment_token_contract: PaymentTokenContractClass;
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

export interface Metadata {
  asset: MetadataAsset;
  schema: string;
}

export interface MetadataAsset {
  id: string;
  address: string;
  quantity: string;
}

export interface TopOwnership {
  owner: Creator;
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
