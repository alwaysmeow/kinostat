export function relativeRatingColor(colors: string[], rating: number, ratings: number[]) {
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);

    if (!colors.length) return "transparent";
    if (!Number.isFinite(minRating) || !Number.isFinite(maxRating)) {
        return colors[Math.floor(colors.length / 2)];
    }

    const range = maxRating - minRating;
    const position = range === 0
        ? (colors.length - 1) / 2
        : ((rating - minRating) / range) * (colors.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(colors.length - 1, Math.ceil(position));
    const progress = position - lowerIndex;
    const lowerColor = colors[lowerIndex];
    const upperColor = colors[upperIndex];
    const interpolateChannel = (offset: number) => {
        const lower = parseInt(lowerColor.slice(offset, offset + 2), 16);
        const upper = parseInt(upperColor.slice(offset, offset + 2), 16);
        return Math.round(lower + (upper - lower) * progress)
            .toString(16)
            .padStart(2, "0");
    };

    return `#${interpolateChannel(1)}${interpolateChannel(3)}${interpolateChannel(5)}`;
}
