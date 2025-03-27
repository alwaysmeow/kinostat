<template>
    <div class="genres-tab">
        <line-chart
            :data="yearsCountData"
            :colors="['#ff8040', '#ffe040', '#ff405f']"
            :library="lineChartOptions"
        ></line-chart>
        <line-chart
            :data="yearsVoteData"
            :colors="['#ff8040', '#ffe040', '#ff405f']"
            :library="lineChartOptions"
        ></line-chart>
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

    created() {
        this.votes.forEach((vote) => {
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
}
</script>

<style lang="sass"></style>
