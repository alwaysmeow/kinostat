<template>
    <div class="years-tab">
        <div class="years-summary">
            <div class="years-summary-item years-summary-item-compact">
                <span class="years-summary-value">{{ totalRatings }}</span>
                <span class="years-summary-label">Rated films</span>
            </div>
            <div class="years-summary-item years-summary-item-compact">
                <span class="years-summary-value">{{ releaseSpan }}</span>
                <span class="years-summary-label">Release span</span>
            </div>
            <div class="years-summary-item">
                <span class="years-summary-label">Most represented years</span>
                <ol class="years-summary-ranking">
                    <li v-for="item in mostRepresentedYears" :key="item.year">
                        <strong>{{ item.year }}</strong>
                        <span>{{ item.count }} films</span>
                    </li>
                </ol>
            </div>
            <div class="years-summary-item">
                <span class="years-summary-label">Highest average ratings</span>
                <ol class="years-summary-ranking">
                    <li v-for="item in highestRatedYears" :key="item.year">
                        <strong>{{ item.year }}</strong>
                        <span>{{ item.average.toFixed(1) }} · {{ item.count }} films</span>
                    </li>
                </ol>
            </div>
        </div>

        <section class="years-chart-card">
            <div class="years-chart-heading">
                <h3>Number of ratings</h3>
                <p>How many rated films were released each year</p>
            </div>
            <line-chart
                :data="yearsCountData"
                :colors="['#ff8040', '#ffe040', '#ff405f']"
                :library="lineChartOptions"
                height="340px"
                suffix=" films"
            ></line-chart>
        </section>

        <section class="years-chart-card">
            <div class="years-chart-heading">
                <h3>Average rating</h3>
                <p>Your average score for films from each release year</p>
            </div>
            <line-chart
                :data="yearsVoteData"
                :colors="['#ff8040', '#ffe040', '#ff405f']"
                :library="lineChartOptions"
                height="340px"
                :round="1"
            ></line-chart>
        </section>

        <section class="years-chart-card">
            <div class="years-chart-heading">
                <h3>Rating and number of films</h3>
                <p>Each point is a release year</p>
            </div>
            <scatter-chart
                :data="yearScatterData"
                :library="yearScatterChartOptions"
                height="380px"
            ></scatter-chart>
        </section>

        <section class="decades-section">
            <div class="years-chart-heading">
                <h3>By decade</h3>
                <p>Ratings grouped by the decade in which each film was released</p>
            </div>

            <div class="decades-grid">
                <div
                    v-for="decade in decadesData"
                    :key="decade.decade"
                    class="decade-item"
                >
                    <strong>{{ decade.label }}</strong>
                    <span>{{ decade.count }} films</span>
                    <span>{{ decade.average.toFixed(1) }} average</span>
                </div>
            </div>

            <div class="decades-pie">
                <div class="decades-pie-heading">
                    <h4>Films by decade</h4>
                    <p>Share of all rated films</p>
                </div>
                <pie-chart
                    :data="decadesPieData"
                    :colors="decadeColors"
                    :library="decadePieChartOptions"
                    height="380px"
                    suffix=" films"
                ></pie-chart>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import ChartMixin from "../mixins/chart.mixin";

interface Year {
    year: number;
    films: number[];
}

export default class YearsTabComponent extends mixins(StoreMixin, ChartMixin) {
    yearsData: Year[] = [];

    decadeColors = [
        "#E93C3C",
        "#E84842",
        "#E75A4B",
        "#E66C54",
        "#E5805E",
        "#E0A26D",
        "#E0C37F",
        "#A8B97C",
        "#70AF79",
        "#38A576",
        "#009B72",
    ];

    decadePieChartOptions = {
        plugins: {
            datalabels: {
                display: false,
            },
            legend: {
                position: "right",
                labels: {
                    color: "#888888",
                    padding: 14,
                    usePointStyle: true,
                    pointStyle: "circle",
                },
            },
            tooltip: {
                backgroundColor: "#242424",
                titleColor: "#ffffff",
                bodyColor: "#ffffff",
                padding: 12,
                cornerRadius: 10,
                displayColors: true,
            },
        },
        elements: {
            arc: {
                borderWidth: 0,
            },
        },
    };

    yearScatterChartOptions = {
        elements: {
            point: {
                radius: 5,
                hoverRadius: 8,
                borderWidth: 0,
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    color: "rgba(255, 255, 255, 0.07)",
                },
                ticks: {
                    color: "#888888",
                    precision: 0,
                },
                title: {
                    display: true,
                    text: "Number of rated films",
                    color: "#888888",
                },
            },
            y: {
                min: 1,
                max: 10,
                grid: {
                    color: "rgba(255, 255, 255, 0.07)",
                },
                ticks: {
                    color: "#888888",
                },
                title: {
                    display: true,
                    text: "Average rating",
                    color: "#888888",
                },
            },
        },
        plugins: {
            datalabels: {
                display: false,
            },
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "#242424",
                titleColor: "#ffffff",
                bodyColor: "#ffffff",
                padding: 12,
                cornerRadius: 10,
                displayColors: false,
                callbacks: {
                    title: () => "",
                    label: (context: any) => {
                        const year = context.dataset.label;
                        const { x, y } = context.parsed;
                        return `${year}: ${x} films · ${y.toFixed(1)} average`;
                    },
                },
            },
        },
    };

    created() {
        this.votes
            .filter((vote) => Number.isFinite(vote.year))
            .forEach((vote) => {
            const yearIndex = this.yearsData.findIndex(
                (yearItem) => yearItem.year === vote.year
            );

            if (yearIndex >= 0) {
                this.yearsData[yearIndex].films.push(vote.filmId);
            } else {
                this.yearsData.push({
                    year: vote.year,
                    films: [vote.filmId],
                });
            }
            });

        this.yearsData.sort((left, right) => left.year - right.year);
    }

    get yearsCountData() {
        const result: number[][] = [];

        this.yearsData.forEach((yearItem) => {
            result.push([yearItem.year, yearItem.films.length]);
        });

        return result;
    }

    get yearsVoteData() {
        const result: number[][] = [];

        this.yearsData.forEach((yearItem) => {
            const count = yearItem.films.length;
            const sum = yearItem.films.reduce((a, b) => {
                const value =
                    this.votes.find((item) => item.filmId === b)?.value || 0;
                return a + value;
            }, 0);

            result.push([yearItem.year, sum / count]);
        });

        return result;
    }

    get totalRatings() {
        return this.yearsData.reduce(
            (total, yearItem) => total + yearItem.films.length,
            0
        );
    }

    get releaseSpan() {
        if (!this.yearsData.length) return "—";
        return `${this.yearsData[0].year}–${
            this.yearsData[this.yearsData.length - 1].year
        }`;
    }

    get mostRepresentedYears() {
        return this.yearsData
            .map((yearItem) => ({
                year: yearItem.year,
                count: yearItem.films.length,
            }))
            .sort((left, right) =>
                right.count - left.count || right.year - left.year
            )
            .slice(0, 3);
    }

    get highestRatedYears() {
        return this.yearsVoteData
            .map(([year, average]) => ({
                year,
                average,
                count:
                    this.yearsData.find((item) => item.year === year)?.films
                        .length ?? 0,
            }))
            .sort((left, right) =>
                right.average - left.average || right.count - left.count
            )
            .slice(0, 3);
    }

    get decadesData() {
        const voteValues = new Map(
            this.votes.map((vote) => [vote.filmId, vote.value])
        );
        const decades = new Map<
            number,
            { decade: number; label: string; count: number; total: number }
        >();

        this.yearsData.forEach((yearItem) => {
            const decade = Math.floor(yearItem.year / 10) * 10;
            const current = decades.get(decade) ?? {
                decade,
                label: `${decade}s`,
                count: 0,
                total: 0,
            };

            yearItem.films.forEach((filmId) => {
                current.count += 1;
                current.total += voteValues.get(filmId) ?? 0;
            });
            decades.set(decade, current);
        });

        return Array.from(decades.values())
            .sort((left, right) => left.decade - right.decade)
            .map((item) => ({
                ...item,
                average: item.count ? item.total / item.count : 0,
            }));
    }

    get decadesPieData() {
        return this.decadesData.map((item) => [item.label, item.count]);
    }

    get yearScatterData() {
        const averages = new Map<number, number>();
        this.yearsVoteData.forEach(([year, average]) => {
            averages.set(year, average);
        });

        return this.yearsData.map((yearItem) => ({
            name: String(yearItem.year),
            color: "#ff8040",
            data: [
                [
                    yearItem.films.length,
                    averages.get(yearItem.year) ?? 0,
                ],
            ],
        }));
    }
}
</script>

<style lang="sass">
.years-tab
    display: flex
    flex-direction: column
    gap: 1.5rem

    .years-summary
        display: grid
        grid-template-columns: repeat(4, minmax(0, 1fr))
        gap: 1rem

    .years-summary-item
        display: flex
        flex-direction: column
        padding: 1.25rem 1.5rem
        border-radius: 1.25rem
        background: var(--neutral-shade-one)

        &.years-summary-item-compact
            justify-content: center

    .years-summary-value
        font-size: 1.5rem
        font-weight: 700

    .years-summary-label
        color: var(--secondary-text-color)
        font-size: 0.9rem

    .years-summary-ranking
        display: flex
        flex-direction: column
        gap: 0.35rem
        margin: 0.65rem 0 0
        padding: 0
        list-style: none
        counter-reset: ranking

        li
            display: grid
            grid-template-columns: auto 1fr auto
            align-items: baseline
            gap: 0.5rem
            counter-increment: ranking

            &::before
                content: counter(ranking)
                color: var(--secondary-text-color)
                font-size: 0.75rem

            span
                color: var(--secondary-text-color)
                font-size: 0.85rem
                white-space: nowrap

    .years-chart-card
        padding: 1.5rem
        border-radius: 1.5rem
        background: var(--neutral-shade-one)

    .decades-section
        padding: 1.5rem
        border-radius: 1.5rem
        background: var(--neutral-shade-one)

    .decades-grid
        display: grid
        grid-template-columns: repeat(4, minmax(0, 1fr))
        gap: 0.75rem

    .decade-item
        display: flex
        flex-direction: column
        padding: 1rem
        border-radius: 1rem
        background: var(--background-color)

        strong
            margin-bottom: 0.25rem
            font-size: 1.1rem

        span
            color: var(--secondary-text-color)
            font-size: 0.85rem

    .decades-pie
        margin-top: 1.5rem
        padding-top: 1.5rem
        border-top: 1px solid rgba(255, 255, 255, 0.08)

    .decades-pie-heading
        h4
            margin: 0
            font-size: 1.1rem

        p
            margin: 0.2rem 0 0
            color: var(--secondary-text-color)
            font-size: 0.9rem

    .years-chart-heading
        margin-bottom: 1rem

        h3
            margin: 0
            font-size: 1.35rem

        p
            margin: 0.25rem 0 0
            color: var(--secondary-text-color)

@media (max-width: 700px)
    .years-tab
        .years-summary
            grid-template-columns: 1fr

        .years-chart-card
            padding: 1rem

        .decades-section
            padding: 1rem

        .decades-grid
            grid-template-columns: repeat(2, minmax(0, 1fr))

@media (min-width: 701px) and (max-width: 1100px)
    .years-tab
        .years-summary
            grid-template-columns: repeat(2, minmax(0, 1fr))

        .decades-grid
            grid-template-columns: repeat(3, minmax(0, 1fr))
</style>
