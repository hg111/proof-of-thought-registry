"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SealingAnimation from "./SealingAnimation";

export default function SuccessPageWrapper({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    // Check if ?animate=true is present
    const shouldAnimate = searchParams.get("animate") === "true";

    // Internal state to track if animation is complete
    // If not animating, we are "complete" immediately.
    const [animationComplete, setAnimationComplete] = useState(!shouldAnimate);

    // If param is present, start with animation overlay.
    // Once complete, show children.

    // Cleanup URL to prevent replay on refresh/back
    useEffect(() => {
        if (shouldAnimate) {
            const url = new URL(window.location.href);
            url.searchParams.delete("animate");
            window.history.replaceState({}, "", url.toString());
        }
    }, [shouldAnimate]);

    // Actually, we want to show children underneath? 
    // The SealingAnimation has a background overlay.
    // So we can render children always, and just overlay the animation if needed.

    // If user refreshes with ?animate=true, it will play again. That's acceptable for now.

    if (!animationComplete) {
        return (
            <>
                <SealingAnimation onComplete={() => setAnimationComplete(true)} />
                {/* Hide content while animating? Optional. */}
                <div style={{ opacity: 0, height: 0, overflow: "hidden" }}>
                    {children}
                </div>
            </>
        );
    }

    return <>{children}</>;
}
