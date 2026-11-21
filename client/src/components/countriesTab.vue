<template>
    <div class="countries-tab">
        <div class="countries-summary">
            <div class="countries-summary-item">
                <strong>{{ countries.length }}</strong>
                <span>Countries</span>
            </div>
            <div class="countries-summary-item">
                <strong>{{ mostWatchedCountry?.name ?? "—" }}</strong>
                <span>Most watched · {{ mostWatchedCountry?.films.length ?? 0 }} films</span>
            </div>
            <div class="countries-summary-item">
                <span>Highest rated countries</span>
                <ol class="countries-summary-ranking">
                    <li v-for="country in highestRatedCountries" :key="country.name">
                        <strong>{{ country.name }}</strong>
                        <span>{{ country.averageVote.toFixed(1) }} · {{ country.films.length }} films</span>
                    </li>
                </ol>
            </div>
            <div class="countries-summary-item">
                <span>Lowest rated countries</span>
                <ol class="countries-summary-ranking">
                    <li v-for="country in lowestRatedCountries" :key="country.name">
                        <strong>{{ country.name }}</strong>
                        <span>{{ country.averageVote.toFixed(1) }} · {{ country.films.length }} films</span>
                    </li>
                </ol>
            </div>
        </div>

        <section class="countries-chart-card">
            <div class="countries-chart-header">
                <div>
                    <h3>Countries</h3>
                    <p>Average rating by production country</p>
                </div>
                <div class="countries-sort" aria-label="Sort countries">
                    <button :class="{ active: sortMode === 'count' }" @click="sortMode = 'count'">Most watched</button>
                    <button :class="{ active: sortMode === 'rating' }" @click="sortMode = 'rating'">Highest rated</button>
                </div>
            </div>
            <bar-chart
                :data="countriesVoteData"
                :colors="countryColors"
                :library="countriesChartOptions"
                :dataset="{ borderWidth: 0 }"
                :height="`${countries.length * 44}px`"
            ></bar-chart>
        </section>

        <section class="country-metric-section">
            <div class="country-metric-heading">
                <div>
                    <h3>Adjusted rating</h3>
                    <p>A softer comparison for countries with different sample sizes</p>
                </div>
                <code>(n × rating + k × baseline) / (n + k)</code>
            </div>
            <div class="country-metric-grid">
                <div class="country-metric-item country-metric-number">
                    <strong>{{ countryRatingMetric.baseline.toFixed(2) }}</strong>
                    <span>Personal baseline</span>
                </div>
                <div class="country-metric-item country-metric-number">
                    <strong>{{ countryRatingMetric.k.toFixed(2) }}</strong>
                    <span>Correction strength k{{ countryRatingMetric.usedFallback ? " · fallback" : "" }}</span>
                </div>
                <div class="country-metric-item">
                    <span>Highest adjusted ratings</span>
                    <ol class="countries-summary-ranking">
                        <li v-for="country in highestAdjustedCountries" :key="country.name">
                            <strong>{{ country.name }}</strong>
                            <span>{{ country.adjusted.toFixed(2) }} · {{ country.films.length }} films</span>
                        </li>
                    </ol>
                </div>
                <div class="country-metric-item">
                    <span>Lowest adjusted ratings</span>
                    <ol class="countries-summary-ranking">
                        <li v-for="country in lowestAdjustedCountries" :key="country.name">
                            <strong>{{ country.name }}</strong>
                            <span>{{ country.adjusted.toFixed(2) }} · {{ country.films.length }} films</span>
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
import {
    adjustedAttributeRating,
    estimateAttributeRatingMetric,
} from "../common/genreRating";

export default class CountriesTabComponent extends mixins(StoreMixin, ChartMixin) {
    sortMode: "count" | "rating" = "count";

    ratingColors = [
        "#E93C3C", "#E84D45", "#E75E4D", "#E5805E", "#E0C37F",
        "#A8B97C", "#70AF79", "#38A576", "#1CA074", "#009B72",
    ];

    countriesChartOptions = {
        ...this.barChartOptions,
        scales: {
            x: {
                ...this.barChartOptions.scales.x,
                ticks: { ...this.barChartOptions.scales.x.ticks, color: "#888888" },
                grid: { color: "rgba(255, 255, 255, 0.07)" },
            },
            y: {
                ...this.barChartOptions.scales.y,
                ticks: { ...this.barChartOptions.scales.y.ticks, color: "#aaaaaa" },
                grid: { display: false },
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
                    label: (context: any) => `${Number(context.raw).toFixed(1)} average`,
                },
            },
        },
    };

    get sortedCountries() {
        return [...this.countries].sort((left, right) =>
            this.sortMode === "count"
                ? right.films.length - left.films.length || right.averageVote - left.averageVote
                : right.averageVote - left.averageVote || right.films.length - left.films.length
        );
    }

    get countriesVoteData() {
        return this.sortedCountries.map((country) => [
            `${country.name} (${country.films.length})`,
            Number(country.averageVote.toPrecision(3).toString()),
        ]);
    }

    get countryColors() {
        return this.sortedCountries.map((country) => {
            const index = Math.max(0, Math.min(9, Math.round(country.averageVote) - 1));
            return this.ratingColors[index];
        });
    }

    get mostWatchedCountry() {
        return [...this.countries].sort((left, right) => right.films.length - left.films.length)[0];
    }

    get highestRatedCountries() {
        return [...this.countries]
            .sort((left, right) => right.averageVote - left.averageVote || right.films.length - left.films.length)
            .slice(0, 3);
    }

    get lowestRatedCountries() {
        return [...this.countries]
            .sort((left, right) => left.averageVote - right.averageVote || right.films.length - left.films.length)
            .slice(0, 3);
    }

    get countryRatingMetric() {
        return estimateAttributeRatingMetric(this.countries, this.votes, {
            softenPrior: false,
        });
    }

    get adjustedCountries() {
        const metric = this.countryRatingMetric;
        return this.countries.map((country) => ({
            ...country,
            adjusted: adjustedAttributeRating(country.averageVote, country.films.length, metric),
        }));
    }

    get highestAdjustedCountries() {
        return [...this.adjustedCountries]
            .sort((left, right) => right.adjusted - left.adjusted || right.films.length - left.films.length)
            .slice(0, 3);
    }

    get lowestAdjustedCountries() {
        return [...this.adjustedCountries]
            .sort((left, right) => left.adjusted - right.adjusted || right.films.length - left.films.length)
            .slice(0, 3);
    }
}
</script>

<style lang="sass">
.countries-tab
    display: flex
    flex-direction: column
    gap: 1.5rem

    .countries-summary
        display: grid
        grid-template-columns: repeat(4, minmax(0, 1fr))
        gap: 1rem

    .countries-summary-item
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

    .countries-summary-ranking
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

    .countries-chart-card,
    .country-metric-section
        padding: 1.5rem
        border-radius: 1.5rem
        background: var(--neutral-shade-one)

    .countries-chart-header,
    .country-metric-heading
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

    .country-metric-heading code
        padding: 0.65rem 0.8rem
        border-radius: 0.75rem
        background: var(--background-color)
        color: var(--secondary-text-color)
        white-space: nowrap

    .country-metric-grid
        display: grid
        grid-template-columns: repeat(4, minmax(0, 1fr))
        gap: 0.75rem

    .country-metric-item
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

        &.country-metric-number strong
            font-size: 1.5rem

    .countries-sort
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
    .countries-tab
        .countries-summary,
        .country-metric-grid
            grid-template-columns: 1fr

        .countries-chart-card,
        .country-metric-section
            padding: 1rem

        .countries-chart-header,
        .country-metric-heading
            flex-direction: column

        .country-metric-heading code
            max-width: 100%
            overflow-x: auto

        .countries-sort
            width: 100%

            button
                flex: 1

@media (min-width: 701px) and (max-width: 1050px)
    .countries-tab
        .countries-summary,
        .country-metric-grid
            grid-template-columns: repeat(2, minmax(0, 1fr))
</style>
