<template>
    <div class="genres-tab">
        <div class="genres-summary">
            <div class="genres-summary-item">
                <strong>{{ genres.length }}</strong>
                <span>Genres</span>
            </div>
            <div
                class="genres-summary-item genres-summary-link"
                @click="mostWatchedGenre && openGenre(mostWatchedGenre)"
            >
                <strong>{{ titleCase(mostWatchedGenre?.name) }}</strong>
                <span>Most watched · {{ mostWatchedGenre?.films.length ?? 0 }} films</span>
            </div>
            <div class="genres-summary-item">
                <span>Highest rated genres</span>
                <ol class="genres-summary-ranking">
                    <li v-for="genre in highestRatedGenres" :key="genre.name" @click="openGenre(genre)">
                        <strong>{{ titleCase(genre.name) }}</strong>
                        <span>{{ genre.averageVote.toFixed(1) }} · {{ genre.films.length }} films</span>
                    </li>
                </ol>
            </div>
            <div class="genres-summary-item">
                <span>Lowest rated genres</span>
                <ol class="genres-summary-ranking">
                    <li v-for="genre in lowestRatedGenres" :key="genre.name" @click="openGenre(genre)">
                        <strong>{{ titleCase(genre.name) }}</strong>
                        <span>{{ genre.averageVote.toFixed(1) }} · {{ genre.films.length }} films</span>
                    </li>
                </ol>
            </div>
        </div>

        <section class="genres-chart-card">
            <div class="genres-chart-header">
                <div>
                    <h3>Genres</h3>
                    <p>Average rating by genre</p>
                </div>
                <div class="genres-sort" aria-label="Sort genres">
                    <button
                        :class="{ active: sortMode === 'count' }"
                        @click="sortMode = 'count'"
                    >Most watched</button>
                    <button
                        :class="{ active: sortMode === 'rating' }"
                        @click="sortMode = 'rating'"
                    >Highest rated</button>
                </div>
            </div>

            <div @click="onGenresChartClick">
                <bar-chart
                    ref="genresChart"
                    :data="genresVoteData"
                    :colors="genreColors"
                    :library="genresChartOptions"
                    :dataset="{ borderWidth: 0 }"
                    :height="`${genres.length * 44}px`"
                ></bar-chart>
            </div>
        </section>

        <section class="genre-metric-section">
            <div class="genre-metric-heading">
                <div>
                    <h3>Adjusted rating</h3>
                    <p>A softer comparison for genres with different sample sizes</p>
                </div>
                <code>(n × rating + k × baseline) / (n + k)</code>
            </div>

            <div class="genre-metric-grid">
                <div class="genre-metric-item genre-metric-number">
                    <strong>{{ genreRatingMetric.baseline.toFixed(2) }}</strong>
                    <span>Personal baseline</span>
                </div>
                <div class="genre-metric-item genre-metric-number">
                    <strong>{{ genreRatingMetric.k.toFixed(2) }}</strong>
                    <span>Correction strength k{{ genreRatingMetric.usedFallback ? " · fallback" : "" }}</span>
                </div>
                <div class="genre-metric-item">
                    <span>Highest adjusted ratings</span>
                    <ol class="genres-summary-ranking">
                        <li v-for="genre in highestAdjustedGenres" :key="genre.name" @click="openGenre(genre)">
                            <strong>{{ titleCase(genre.name) }}</strong>
                            <span>{{ genre.adjusted.toFixed(2) }} · {{ genre.films.length }} films</span>
                        </li>
                    </ol>
                </div>
                <div class="genre-metric-item">
                    <span>Lowest adjusted ratings</span>
                    <ol class="genres-summary-ranking">
                        <li v-for="genre in lowestAdjustedGenres" :key="genre.name" @click="openGenre(genre)">
                            <strong>{{ titleCase(genre.name) }}</strong>
                            <span>{{ genre.adjusted.toFixed(2) }} · {{ genre.films.length }} films</span>
                        </li>
                    </ol>
                </div>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import ChartMixin from "../mixins/chart.mixin";
import type { FilmAttribute } from "../common/types";
import {
    adjustedAttributeRating,
    estimateAttributeRatingMetric,
} from "../common/genreRating";

export default class GenresTabComponent extends mixins(StoreMixin, ChartMixin) {
    sortMode: "count" | "rating" = "count";

    ratingColors = [
        "#E93C3C",
        "#E84D45",
        "#E75E4D",
        "#E5805E",
        "#E0C37F",
        "#A8B97C",
        "#70AF79",
        "#38A576",
        "#1CA074",
        "#009B72",
    ];

    genresChartOptions = {
        ...this.barChartOptions,
        scales: {
            x: {
                ...this.barChartOptions.scales.x,
                ticks: {
                    ...this.barChartOptions.scales.x.ticks,
                    color: "#888888",
                },
                grid: {
                    color: "rgba(255, 255, 255, 0.07)",
                },
            },
            y: {
                ...this.barChartOptions.scales.y,
                ticks: {
                    ...this.barChartOptions.scales.y.ticks,
                    color: "#aaaaaa",
                },
                grid: {
                    display: false,
                },
            },
        },
        plugins: {
            ...this.barChartOptions.plugins,
            tooltip: {
                enabled: true,
                backgroundColor: "#242424",
                titleColor: "#ffffff",
                bodyColor: "#ffffff",
                padding: 12,
                cornerRadius: 10,
                displayColors: false,
                callbacks: {
                    label: (context: any) =>
                        `${Number(context.raw).toFixed(1)} average`,
                },
            },
        },
    };

    get sortedGenres() {
        return [...this.genres].sort((left, right) =>
            this.sortMode === "count"
                ? right.films.length - left.films.length ||
                  right.averageVote - left.averageVote
                : right.averageVote - left.averageVote ||
                  right.films.length - left.films.length
        );
    }

    get genresVoteData() {
        return this.sortedGenres.map((genre) => [
                `${this.titleCase(genre.name)} (${genre.films.length})`,
                Number(genre.averageVote.toPrecision(3).toString()),
            ]);
    }

    get genreColors() {
        return this.sortedGenres.map((genre) => {
            const index = Math.max(
                0,
                Math.min(9, Math.round(genre.averageVote) - 1)
            );
            return this.ratingColors[index];
        });
    }

    get mostWatchedGenre() {
        return [...this.genres].sort(
            (left, right) => right.films.length - left.films.length
        )[0];
    }

    get highestRatedGenres() {
        return [...this.genres]
            .sort((left, right) =>
                right.averageVote - left.averageVote ||
                right.films.length - left.films.length
            )
            .slice(0, 3);
    }

    get lowestRatedGenres() {
        return [...this.genres].sort((left, right) =>
            left.averageVote - right.averageVote ||
            right.films.length - left.films.length
        ).slice(0, 3);
    }

    get genreRatingMetric() {
        return estimateAttributeRatingMetric(this.genres, this.votes);
    }

    get adjustedGenres() {
        const metric = this.genreRatingMetric;
        return this.genres.map((genre) => ({
            ...genre,
            adjusted: adjustedAttributeRating(
                genre.averageVote,
                genre.films.length,
                metric
            ),
        }));
    }

    get highestAdjustedGenres() {
        return [...this.adjustedGenres]
            .sort((left, right) =>
                right.adjusted - left.adjusted ||
                right.films.length - left.films.length
            )
            .slice(0, 3);
    }

    get lowestAdjustedGenres() {
        return [...this.adjustedGenres]
            .sort((left, right) =>
                left.adjusted - right.adjusted ||
                right.films.length - left.films.length
            )
            .slice(0, 3);
    }

    titleCase(value?: string) {
        if (!value) return "—";
        return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    openGenre(genre: FilmAttribute) {
        this.openFilmList(this.titleCase(genre.name), genre.films);
    }

    onGenresChartClick(event: MouseEvent) {
        const index = this.getClickedChartElements("genresChart", event, "y")[0]?.index;
        if (index !== undefined) this.openGenre(this.sortedGenres[index]);
    }
}
</script>

<style lang="sass">
.genres-tab
    display: flex
    flex-direction: column
    gap: 1.5rem

    .genres-summary
        display: grid
        grid-template-columns: repeat(4, minmax(0, 1fr))
        gap: 1rem

    .genres-summary-item
        display: flex
        flex-direction: column
        justify-content: center
        min-height: 6rem
        padding: 1.25rem 1.5rem
        border-radius: 1.25rem
        background: var(--neutral-shade-one)

        strong
            font-size: 1.35rem

        span
            color: var(--secondary-text-color)
            font-size: 0.9rem

        &.genres-summary-link
            cursor: pointer

            &:hover strong
                color: var(--kinopoisk-color)

    .genres-summary-ranking
        display: flex
        flex-direction: column
        gap: 0.35rem
        margin: 0.65rem 0 0
        padding: 0
        list-style: none
        counter-reset: ranking

        li
            display: grid
            grid-template-columns: auto minmax(0, 1fr) auto
            align-items: baseline
            gap: 0.5rem
            counter-increment: ranking
            cursor: pointer

            &:hover strong
                color: var(--kinopoisk-color)

            &::before
                content: counter(ranking)
                color: var(--secondary-text-color)
                font-size: 0.75rem

            strong
                overflow: hidden
                font-size: 0.95rem
                text-overflow: ellipsis
                white-space: nowrap

            span
                font-size: 0.8rem
                white-space: nowrap

    .genres-chart-card
        padding: 1.5rem
        border-radius: 1.5rem
        background: var(--neutral-shade-one)

        canvas
            cursor: pointer

    .genre-metric-section
        padding: 1.5rem
        border-radius: 1.5rem
        background: var(--neutral-shade-one)

    .genre-metric-heading
        display: flex
        align-items: flex-start
        justify-content: space-between
        gap: 1rem
        margin-bottom: 1rem

        h3
            margin: 0
            font-size: 1.35rem

        p
            margin: 0.25rem 0 0
            color: var(--secondary-text-color)

        code
            padding: 0.65rem 0.8rem
            border-radius: 0.75rem
            background: var(--background-color)
            color: var(--secondary-text-color)
            white-space: nowrap

    .genre-metric-grid
        display: grid
        grid-template-columns: repeat(4, minmax(0, 1fr))
        gap: 0.75rem

    .genre-metric-item
        display: flex
        flex-direction: column
        justify-content: center
        min-height: 6rem
        padding: 1rem
        border-radius: 1rem
        background: var(--background-color)

        > span
            color: var(--secondary-text-color)
            font-size: 0.9rem

        &.genre-metric-number strong
            font-size: 1.5rem

    .genres-chart-header
        display: flex
        align-items: flex-start
        justify-content: space-between
        gap: 1rem
        margin-bottom: 1rem

        h3
            margin: 0
            font-size: 1.35rem

        p
            margin: 0.25rem 0 0
            color: var(--secondary-text-color)

    .genres-sort
        display: flex
        gap: 0.5rem

        button
            padding: 0.7rem 1rem
            border: 0
            border-radius: 0.85rem
            background: var(--background-color)
            color: var(--secondary-text-color)

            &.active
                background: var(--neutral-shade-two)
                color: var(--main-text-color)

@media (max-width: 700px)
    .genres-tab
        .genres-summary
            grid-template-columns: 1fr

        .genres-chart-card
            padding: 1rem

        .genre-metric-section
            padding: 1rem

        .genre-metric-heading
            flex-direction: column

            code
                max-width: 100%
                overflow-x: auto

        .genre-metric-grid
            grid-template-columns: 1fr

        .genres-chart-header
            flex-direction: column

        .genres-sort
            width: 100%

            button
                flex: 1

@media (min-width: 701px) and (max-width: 1050px)
    .genres-tab
        .genres-summary
            grid-template-columns: repeat(2, minmax(0, 1fr))

        .genre-metric-grid
            grid-template-columns: repeat(2, minmax(0, 1fr))
</style>
