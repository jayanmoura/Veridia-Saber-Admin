export function extractCodeNumber(code: string | null | undefined): number {
    if (!code) return 0;
    const match = code.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
}
