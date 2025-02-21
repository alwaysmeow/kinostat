<template>
    <div class="directors-list">
        <h4>Режиссеры</h4>
        <div class="directors-list-toolbar">
            <v-text-field
                clearable
                prepend-inner-icon="$search"
                v-model="searchLine"
                variant="outlined"
                hide-details
            ></v-text-field>
        </div>
        <div class="director-items">
            <director-item v-for="director in directorsList" :id="director.id" :key="director.id"></director-item>
        </div>
    </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import StoreMixin from "../mixins/store.mixin";

import type { Person } from "../types/types";

export default class DirectorsListComponent extends mixins(StoreMixin) {
    searchLine: string = "";

    get filterString(): string {
        return (this.searchLine || "").trim().toLocaleLowerCase();
    }

    get sortedDirectors(): Person[] {
        return [...this.directors].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }

    get directorsList(): Person[] {
        const filterFunction = (director: Person): boolean => {
            const fullname: string = director.name.toLocaleLowerCase();
            const names: string[] = fullname.split(/[ ,.:]+/);
            return (
                names.some((word) => word.startsWith(this.filterString)) ||
                fullname.startsWith(this.filterString)
            );
        };

        return [...this.sortedDirectors].filter(filterFunction);
    }

    created() {
        this.films.forEach((film) =>
            film.directors.forEach((directorRecord: Person) => {
                const director = this.getDirector(directorRecord.id);

                if (director) {
                    director.films.push(film.id);
                } else {
                    this.addDirector({
                        id: directorRecord.id,
                        name: directorRecord.name,
                        films: [film.id],
                    });
                }
            })
        );
    }
}
</script>

<style lang="sass">
.directors-list
    display: flex
    flex-direction: column
    gap: 1rem

.director-items
    display: flex
    flex-direction: column
    gap: 1rem

.directors-list-toolbar
    display: flex
    gap: 1rem
</style>
