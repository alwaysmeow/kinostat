import type { FilmAttribute, Vote } from "./types";

export interface GenreRatingMetric {
    baseline: number;
    k: number;
    rawK: number | null;
    usedFallback: boolean;
}

export type AttributeRatingMetric = GenreRatingMetric;

export interface AttributeRatingMetricOptions {
    softenPrior?: boolean;
}

const FALLBACK_K = 1;
const MINIMUM_RATINGS = 30;
const MINIMUM_USABLE_GENRES = 5;

function sampleVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return values.reduce(
        (sum, value) => sum + (value - mean) ** 2,
        0
    ) / (values.length - 1);
}

/**
 * Estimates a personal Bayesian prior strength for genre ratings.
 *
 * A genre mean differs from another genre mean for two reasons:
 * 1. the user genuinely rates the genres differently;
 * 2. random sampling noise, especially when a genre contains few films.
 *
 * We estimate the genuine between-genre variance by subtracting the average
 * sampling variance (genre variance / film count) from the observed variance
 * of genre means. The empirical Bayesian prior strength is then:
 *
 *     rawK = pooled within-genre variance / true between-genre variance
 *
 * A raw empirical-Bayes value can be very large and would make film count
 * dominate a personal-statistics UI. By default, log1p keeps the estimate
 * adaptive while deliberately softening its effect:
 *
 *     k = ln(1 + rawK) / 2
 *
 * Attributes with a long tail of tiny samples can opt out of that softening
 * and use rawK directly. There is no arbitrary clamp. When there is not enough
 * data, or no positive between-attribute signal can be estimated, we use one
 * virtual average film as a transparent fallback (k = 1).
 */
export function estimateGenreRatingMetric(
    genres: FilmAttribute[],
    votes: Vote[],
    options: AttributeRatingMetricOptions = {}
): GenreRatingMetric {
    const voteByFilm = new Map(votes.map((vote) => [vote.filmId, vote.value]));
    const ratings = votes
        .map((vote) => vote.value)
        .filter((value) => Number.isFinite(value));
    const baseline = ratings.length
        ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
        : 0;

    const genreStats = genres
        .map((genre) => {
            const values = genre.films
                .map((filmId) => voteByFilm.get(filmId))
                .filter((value): value is number => Number.isFinite(value));
            return {
                count: values.length,
                mean: values.length
                    ? values.reduce((sum, value) => sum + value, 0) /
                      values.length
                    : 0,
                variance: sampleVariance(values),
            };
        })
        .filter((genre) => genre.count > 1);

    if (
        ratings.length < MINIMUM_RATINGS ||
        genreStats.length < MINIMUM_USABLE_GENRES
    ) {
        return { baseline, k: FALLBACK_K, rawK: null, usedFallback: true };
    }

    const means = genreStats.map((genre) => genre.mean);
    const observedBetweenVariance = sampleVariance(means);
    const averageSamplingVariance =
        genreStats.reduce(
            (sum, genre) => sum + genre.variance / genre.count,
            0
        ) / genreStats.length;
    const trueBetweenVariance =
        observedBetweenVariance - averageSamplingVariance;
    const pooledDenominator = genreStats.reduce(
        (sum, genre) => sum + genre.count - 1,
        0
    );
    const pooledWithinVariance =
        genreStats.reduce(
            (sum, genre) => sum + (genre.count - 1) * genre.variance,
            0
        ) / pooledDenominator;

    if (trueBetweenVariance <= 0 || !Number.isFinite(pooledWithinVariance)) {
        return { baseline, k: FALLBACK_K, rawK: null, usedFallback: true };
    }

    const rawK = pooledWithinVariance / trueBetweenVariance;
    const k = options.softenPrior === false ? rawK : Math.log1p(rawK) / 2;
    return { baseline, k, rawK, usedFallback: false };
}

export const estimateAttributeRatingMetric = estimateGenreRatingMetric;

export function adjustedGenreRating(
    average: number,
    filmCount: number,
    metric: GenreRatingMetric
): number {
    if (!filmCount) return metric.baseline;
    return (
        (filmCount * average + metric.k * metric.baseline) /
        (filmCount + metric.k)
    );
}

export const adjustedAttributeRating = adjustedGenreRating;
