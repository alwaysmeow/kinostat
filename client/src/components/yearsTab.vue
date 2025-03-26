<template>
    <div class="genres-tab">
        <line-chart
            :data="yearsCountData"
        ></line-chart>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import ChartMixin from "../mixins/chart.mixin";

interface Year {
    year: number,
    films: number[]
}

export default class YearsTabComponent extends mixins(StoreMixin, ChartMixin) {
    yearsData: Year[] = [];

    created() {
        this.votes.forEach(vote => {
            const yearIndex = this.yearsData.findIndex(yearItem => yearItem.year === vote.year)
            
            if (yearIndex >= 0) {
                this.yearsData[yearIndex].films.push(vote.filmId)
            } else {
                this.yearsData.push({
                    year: vote.year,
                    films: [vote.filmId],
                })
            }
        })
    }

    get yearsCountData() {
        const result: Record<number, number> = {};

        this.yearsData.forEach(yearItem => {
            result[yearItem.year] = yearItem.films.length;
        })

        return result;
    }
}
</script>

<style lang="sass"></style>