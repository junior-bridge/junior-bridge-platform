"use client";

import { useEffect, useState } from "react";
import { TesterReputation } from "@/types/ratingTypes";
import { getMyReputation } from "@/services/rating.service";

export function useReputation() {
    const [reputation, setReputation] = useState<TesterReputation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                const data = await getMyReputation();
                if (isMounted) setReputation(data);
            } catch {
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    return { reputation, loading, error };
}