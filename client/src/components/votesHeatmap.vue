<template>
    <calendar-heatmap
        dark-mode
        :values="activityData"
        :end-date="calendarEndDate"
        :round="3"
        tooltip-unit="оценок"
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
            "Янв",
            "Фев",
            "Мар",
            "Апр",
            "Май",
            "Июн",
            "Июл",
            "Авг",
            "Сен",
            "Окт",
            "Ноя",
            "Дек",
        ],
        days: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    };

    get calendarEndDate(): Date {
        return new Date();
    }

    get activityData(): Activity[] {
        const data: Activity[] = [];
        this.votes.forEach((vote) => {
            const [rawDateString] = vote.time.split(" ");
            const [day, month, year] = rawDateString.split(".");
            const date = new Date(`20${year}-${month}-${day}`); // won't work in 2100
            const datetime = date.getTime();

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
        const votesString =
            item.count === 1 ? "оценка" : item.count > 4 ? "оценок" : "оценки";

        const tooltipString = `<b>${
            item.count
        } ${votesString}</b> ${item.date.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })}`;

        return tooltipString.replace(" г.", "").replace(".", "");
    }
}
</script>

<style lang="sass">
.vch__month__label, .vch__days__labels__wrapper
    fill: var(--secondary-text-color)
    font-size: 0.8rem
    padding: 10rem

.vch__legend
    display: none
</style>
