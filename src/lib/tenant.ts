export const isWillsTheme = process.env.NEXT_PUBLIC_TENANT?.toLowerCase()?.startsWith('will');

export const TENANT_CONFIG = {
    appName: isWillsTheme ? "WILL-SAFE™" : "PROOF OF THOUGHT™",
    heroTitle: isWillsTheme ? "Secure your will and legacy in 30 seconds." : "Prove the idea is yours - seal it in 30 seconds.",
    heroSubhead: isWillsTheme 
        ? "Create a permanent, cryptographically verifiable, time-stamped record of your estate documents."
        : "Create a permanent, cryptographically verifiable, time-stamped record showing that you possessed an original idea at a specific moment in time.",
    recordType: isWillsTheme ? "Estate Record" : "Genesis Record",
    whitepaperLinkText: isWillsTheme ? "" : "Read the Founding White Paper \u2192", // We can hide the whitepaper on the Wills site
    footerTagline: isWillsTheme ? "WILL-SAFE™ \u2022 Cryptographic Custody" : "PROOF OF THOUGHT™ \u2022 Patent Pending",
};
