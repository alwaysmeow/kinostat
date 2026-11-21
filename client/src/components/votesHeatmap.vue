<template>
    <calendar-heatmap
        dark-mode
        :values="activityData"
        :end-date="calendarEndDate"
        :round="3"
        tooltip-unit="ratings"
        :locale="calendarLocale"
        :tooltip-formatter="tooltipFormatter"
        no-data-text=" "
        :range-color="['#333333', '#994420', '#994420', '#df4a00', '#ff5500', '#ff6a20']"
    />
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

type Activity = { date: Date; count: number };

export default class VotesListComponent extends mixins(StoreMixin) {
    calendarLocale = {
        months: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ],
        days: ["S", "M", "T", "W", "T", "F", "S"],
    };

    get calendarEndDate(): Date {
        const dates = this.activityData
            .map((item) => item.date)
            .filter((date) => !Number.isNaN(date.getTime()));
        if (!dates.length) return new Date();
        return new Date(Math.max(...dates.map((date) => date.getTime())));
    }

    get activityData(): Activity[] {
        const data: Activity[] = [];
        this.votes.forEach((vote) => {
            const [rawDateString] = vote.time.split(" ");
            if (!rawDateString) return;
            const [day, month, year] = rawDateString.split(".");
            if (!day || !month || !year) return;
            const date = new Date(`20${year}-${month}-${day}`); // won't work in 2100
            const datetime = date.getTime();
            if (Number.isNaN(datetime)) return;

            const record = data.find(
                (record) => record.date.getTime() === datetime
            );

            if (record) {
                record.count++;
            } else {
                data.push({
                    date: date,
                    count: 1,
                });
            }
        });
        return data;
    }

    tooltipFormatter(item: Activity) {
        const votesString = item.count === 1 ? "rating" : "ratings";

        const tooltipString = `<b>${
            item.count
        } ${votesString}</b> ${item.date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })}`;

        return tooltipString;
    }
}
</script>

<style lang="sass">
.vch__container
    overflow-x: auto
    padding: 0.35rem 0.5rem 0.1rem

.vch__month__label, .vch__day__label
    fill: var(--secondary-text-color)
    font-size: 9px

.vch__days__labels__wrapper .vch__day__label
    fill: var(--secondary-text-color)
    font-size: 8px

.vch__legend
    display: none
</style>
