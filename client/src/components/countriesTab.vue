<template>
    <div class="countries-tab">
        <pie-chart
            :data="countriesCountData"
            :legend="false"
            :colors="['#ff8040', '#ffe040', '#ff405f']"
            :library="pieChartOptions"
        ></pie-chart>
        <bar-chart
            :data="countriesVoteData"
            :colors="['#ff8040']"
            :library="barChartOptions"
            :height="`${Object.keys(countries).length * 40}px`"
        ></bar-chart>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

const MINIMUM_FILMS_TO_SHOW_COUNTRY = 5;

export default class CountriesTabComponent extends mixins(StoreMixin) {
    pieChartOptions = {
        cutout: "50%",
        radius: "70%",
        elements: {
            arc: {
                borderWidth: 0,
            },
        },
        plugins: {
            datalabels: {
                font: {
                    size: 14,
                    weight: "bold",
                },
                formatter: (value: number, context: any) => {
                    return `${
                        context.chart.data.labels[context.dataIndex]
                    } (${value})`;
                },
                anchor: "end",
                align: "end",
                offset: 20,
                clip: false,
            },
        },
    };

    barChartOptions = {
        borderRadius: 5,
        scales: {
          x: {
            ticks: {
              color: '#fff',
                font: {
                    size: 14,
                    weight: 'bold',
                },
            },
            grid: {
              color: '#333333',
            },
          },
          y: {
            ticks: {
              color: '#fff',
                font: {
                    size: 14,
                },
            },
          },
        },
        plugins: {
            datalabels: {
                formatter: (value: number) => {
                    return value;
                },
                anchor: "end",
                align: "end",
                offset: 5,
                clip: false,
            },
            tooltip: {
                enabled: false,
            },
        },
    };

    get countriesCountData() {
        const countries = Object.keys(this.countries);

        const result: [string, number][] = [];
        let restFilmCount = 0;

        countries.forEach((name) => {
            const filmsCount = this.countries[name].films.length;

            if (filmsCount >= MINIMUM_FILMS_TO_SHOW_COUNTRY) {
                result.push([name, filmsCount]);
            } else {
                restFilmCount += filmsCount;
            }
        });

        if (restFilmCount) {
            result.push(["Другие", restFilmCount]);
        }

        return result;
    }

    get countriesVoteData() {
        const countries = Object.keys(this.countries);

        return countries.map((name) => [
            `${name} (${this.countries[name].films.length})`,
            Number(this.countries[name].averageVote.toPrecision(3).toString()),
        ]);
    }
}
</script>

<style lang="sass"></style>
