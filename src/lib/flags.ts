export const isTractionUIEnabled = (): boolean => {
    const val = process.env.NEXT_PUBLIC_ENABLE_TRACTION_UI;
    console.log('[FLAGS] Checking NEXT_PUBLIC_ENABLE_TRACTION_UI:', val);
    if (typeof window === 'undefined') {
        return val === 'true';
    }
    return val === 'true';
};
