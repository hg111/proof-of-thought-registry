import { config } from "./config";

export enum PricingTier {
    GENESIS = 1, // $29
    MINTED = 2,  // $49
    ENGRAVED = 3 // $99
}

export function getTier(recordClass: string | null | undefined): PricingTier {
    if (!recordClass) return PricingTier.GENESIS;

    const rc = recordClass.toUpperCase();
    if (rc === "ENGRAVED") return PricingTier.ENGRAVED;
    if (rc === "MINTED") return PricingTier.MINTED;

    return PricingTier.GENESIS;
}

export function canAccessTraction(tier: PricingTier): boolean {
    if (!config.pricingTiersEnabled) return true;
    return tier >= PricingTier.MINTED;
}

export function canAccessDealRoom(tier: PricingTier): boolean {
    if (!config.pricingTiersEnabled) return true;
    return tier >= PricingTier.ENGRAVED;
}

export const TIER_NAMES = {
    [PricingTier.GENESIS]: "Genesis",
    [PricingTier.MINTED]: "Minted",
    [PricingTier.ENGRAVED]: "Engraved"
};

export const UPGRADE_PRICES = {
    TO_MINTED: "$20", // 49 - 29
    TO_ENGRAVED: "$50" // 99 - 49 (or 70 from genesis)
};
