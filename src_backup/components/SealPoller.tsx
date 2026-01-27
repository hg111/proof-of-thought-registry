"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SealPoller() {
    const router = useRouter();

    useEffect(() => {
        // Poll every 3 seconds to check for updates (e.g. Seal generation)
        const interval = setInterval(() => {
            router.refresh();
        }, 3000);

        return () => clearInterval(interval);
    }, [router]);

    return (
        <p className="small" style={{ color: "#666", marginTop: 10 }}>
            (Checking for seal engraving...)
        </p>
    );
}
