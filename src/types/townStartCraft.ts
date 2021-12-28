export interface TownStarCraftData {
  [key: string]: TownStarCraft;
}

export interface TownStarCraft {
  CityPoints: number;
  CityPrice: number;
  Class: string;
  CraftingText: string;
  Id: number;
  Name: string;
  OnDestroy: string;
  ProximityBonus: string;
  ProximityPenalty: string;
  ProximityReverse: boolean;
  Req1: string;
  Req2: string;
  Req3: string;
  Time0: number;
  Time1: number;
  Time2: number;
  Time3: number;
  Type: string;
  Value1: number;
  Value2: number;
  Value3: number;
}
