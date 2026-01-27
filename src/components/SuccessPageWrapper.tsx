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

    // Safe URL cleanup function
    const cleanupUrl = () => {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            if (url.searchParams.has("animate")) {
                url.searchParams.delete("animate");
                window.history.replaceState({}, "", url.toString());
            }
        }
    };

    // Failsafe: Force complete after 4 seconds to prevent lockup
    useEffect(() => {
        if (shouldAnimate && !animationComplete) {
            const timer = setTimeout(() => {
                setAnimationComplete(true);
                cleanupUrl();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [shouldAnimate, animationComplete]);

    // Handle normal completion
    const handleComplete = () => {
        setAnimationComplete(true);
        cleanupUrl();
    };

    // Actually, we want to show children underneath? 
    // The SealingAnimation has a background overlay.
    // So we can render children always, and just overlay the animation if needed.

    // If user refreshes with ?animate=true, it will play again. That's acceptable for now.

    if (!animationComplete) {
        return (
            <>
                <SealingAnimation onComplete={handleComplete} />
                {children}
            </>
        );
    }

    return <>{children}</>;
}
