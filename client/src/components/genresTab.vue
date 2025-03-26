<template>
    <div class="genres-tab">
        <bar-chart
            :data="genresVoteData"
            :colors="['#ff8040', '#ffe040', '#ff405f']"
            :library="barChartOptions"
            :height="`${Object.keys(genres).length * 40}px`"
        ></bar-chart>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";
import ChartMixin from "../mixins/chart.mixin";

export default class GenresTabComponent extends mixins(StoreMixin, ChartMixin) {
    get genresVoteData() {
        return this.genres
            .sort((a, b) => b.films.length - a.films.length)
            .map((genre) => [
                `${genre.name} (${genre.films.length})`,
                Number(genre.averageVote.toPrecision(3).toString()),
            ]);
    }
}
</script>

<style lang="sass"></style>