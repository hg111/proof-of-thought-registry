// src/lib/records.ts

export type RecordClass =
  | "GENESIS"    // Base cryptographic custody record
  | "MINTED"     // Formal serialed instrument
  | "ENGRAVED";  // Instrument + engraved seal artifact

export const RecordClassLabel: Record<RecordClass, string> = {
  GENESIS: "Genesis Record",
  MINTED: "Minted Instrument",
  ENGRAVED: "Engraved Instrument",
};

export const RecordClassDescription: Record<RecordClass, string> = {
  GENESIS: "Cryptographic proof of possession",
  MINTED: "Sealed, serialed formal evidence instrument",
  ENGRAVED: "Instrument with engraved seal artifact",
};

export const RecordClassPriceCents: Record<RecordClass, number> = {
  GENESIS: 2900,
  MINTED: 4900,
  ENGRAVED: 9900,
};

export function priceForRecordClass(rc: RecordClass): number {
  if (rc === "GENESIS") return 2900;
  if (rc === "MINTED") return 4900;
  return 9900; // ENGRAVED
}

export function stripePriceIdForRecordClass(rc: RecordClass, config: any): string {
  if (rc === "GENESIS") return config.stripePriceGenesis;
  if (rc === "MINTED") return config.stripePriceMinted;
  return config.stripePriceEngraved; // ENGRAVED
}