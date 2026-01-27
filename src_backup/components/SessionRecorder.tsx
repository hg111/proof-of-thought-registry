"use client";

import { useEffect } from "react";

/**
 * Saves the given record ID to localStorage list 'pot_my_records'.
 * This allows the client to "remember" which records it owns/created
 * without requiring a full user account system.
 */
export default function SessionRecorder({ id }: { id: string }) {
    useEffect(() => {
        if (!id) return;
        try {
            const key = "pot_my_records";
            const existing = localStorage.getItem(key);
            let list: string[] = [];
            if (existing) {
                list = JSON.parse(existing);
            }

            // Add if not exists
            if (!list.includes(id)) {
                list.push(id);
                localStorage.setItem(key, JSON.stringify(list));
                console.log("Record added to session:", id);
            }
        } catch (e) {
            console.error("Failed to save session record", e);
        }
    }, [id]);

    return null; // Invisible component
}
