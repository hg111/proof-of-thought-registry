export const isWillsTheme = process.env.NEXT_PUBLIC_TENANT?.toLowerCase()?.startsWith('will');

export const TENANT_CONFIG = {
    appName: isWillsTheme ? "WILL-SAFE™" : "PROOF OF THOUGHT™",
    heroTitle: isWillsTheme ? "Secure your will and legacy in 30 seconds." : "Prove the idea is yours - seal it in 30 seconds.",
    heroSubhead: isWillsTheme 
        ? "Create a permanent, cryptographically verifiable, time-stamped record of your estate documents."
        : "Create a permanent, cryptographically verifiable, time-stamped record showing that you possessed an original idea at a specific moment in time.",
    disclaimerSmall: isWillsTheme 
        ? "No lawyers required to cryptographically seal your document." 
        : "Not a patent filing. No lawyers required.",
    whatItIs: isWillsTheme ? [
        "A formal cryptographic certificate of your estate documents",
        "A private custody vault that preserves your legacy",
        "A time-stamped chain of your will as it evolves",
        "A secure deal room to share access with family or executors"
    ] : [
        "A formal certificate of conception & possession",
        "A private custody vault that preserves your sealed ideas ",
        "A cryptographic chain records your idea as it evolves over time",
        "Early traction for original human ideas, helping transform them into tradeable assets"
    ],
    whatItIsNot: isWillsTheme ? [
        "Not a substitute for formal legal execution in some jurisdictions",
        "Not a public registry of your private assets",
        "Not legal advice",
        "Not a disclosure of your will"
    ] : [
        "Not a patent filing",
        "Not legal advice",
        "Not a government registry",
        "Not a disclosure or publication of your idea"
    ],
    howItWorks: isWillsTheme ? [
        { title: "Upload your document.", desc: "Paste or upload the text of your will or trust." },
        { title: "We time-seal and preserve it.", desc: "We compute a cryptographic fingerprint and record custody." },
        { title: "Receive your certificate.", desc: "Download a formal PDF with a private verification link." },
        { title: "Grant access.", desc: "Securely give executors access via the Deal Room." }
    ] : [
        { title: "Enter your idea.", desc: "Paste your original text." },
        { title: "We time-seal and preserve it.", desc: "We compute a cryptographic fingerprint and record custody." },
        { title: "Receive your certificate.", desc: "Download a formal PDF with a public verification link." },
        { title: "Get traction.", desc: "Receive early market validation or valuation signals." }
    ],
    recordType: isWillsTheme ? "Estate Record" : "Genesis Record",
    whitepaperLinkText: isWillsTheme ? "" : "Read the Founding White Paper \u2192",
    footerTagline: isWillsTheme ? "WILL-SAFE™ \u2022 Cryptographic Custody" : "PROOF OF THOUGHT™ \u2022 Patent Pending",
};
