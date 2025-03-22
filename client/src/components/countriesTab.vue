<template>
    <div class="countries-tab">
        <pie-chart
            :data="countriesCountData"
            :legend="false"
            :colors="['#ff8040', '#ffe040', '#ff405f']"
            :library="pieChartOptions"
        ></pie-chart>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

const MINIMUM_FILMS_TO_SHOW_COUNTRY = 5;

export default class CountriesTabComponent extends mixins(StoreMixin) {
    pieChartOptions = {
        cutout: '50%',
        radius: '70%',
        elements: {
          arc: {
            borderWidth: 0,
          }
        },
        plugins: {
          datalabels: {
            color: '#fff',
            font: {
              size: 14,
              weight: 'bold'
            },
            formatter: (value, context) => {
              return `${context.chart.data.labels[context.dataIndex]} (${value})`;
            },
            anchor: 'end',
            align: 'end',
            offset: 20,
            clip: false,
          }
        }
    }

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
}
</script>

<style lang="sass"></style>
