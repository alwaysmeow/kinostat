<template>
    <section class="country-atlas-card">
        <header class="country-atlas-header">
            <div>
                <h3>World map</h3>
                <p>{{ mappedCountries.length }} countries across {{ totalFilms }} country credits</p>
            </div>
            <div class="country-atlas-controls">
                <div class="country-atlas-view" aria-label="Map area">
                    <button :class="{ active: viewMode === 'world' }" @click="viewMode = 'world'">World</button>
                    <button :class="{ active: viewMode === 'europe' }" @click="viewMode = 'europe'">Europe</button>
                </div>
                <div class="country-atlas-mode" aria-label="Map metric">
                    <button :class="{ active: mode === 'rating' }" @click="mode = 'rating'">Rating</button>
                    <button :class="{ active: mode === 'count' }" @click="mode = 'count'">Films</button>
                </div>
            </div>
        </header>

        <div class="country-atlas-timeline">
            <div class="country-atlas-timeline-copy">
                <span>Political map</span>
                <strong>{{ timeline === 0 ? "1990 · Soviet Union" : "Present day" }}</strong>
            </div>
            <div class="country-atlas-slider-wrap">
                <div class="country-atlas-slider-track">
                    <i :class="{ present: timeline === 1 }"></i>
                    <input
                        v-model.number="timeline"
                        type="range"
                        min="0"
                        max="1"
                        step="1"
                        aria-label="Political map period"
                    />
                </div>
                <div class="country-atlas-slider-labels">
                    <button :class="{ active: timeline === 0 }" @click="timeline = 0">
                        <span>1990</span>
                        <small>Soviet Union</small>
                    </button>
                    <button :class="{ active: timeline === 1 }" @click="timeline = 1">
                        <span>Present</span>
                        <small>Modern borders</small>
                    </button>
                </div>
            </div>
        </div>

        <div ref="mapRoot" class="country-atlas-map" @mouseleave="hoveredCountry = null">
            <div class="country-atlas-canvas">
                <svg :viewBox="mapViewBox" role="img" aria-label="Film production countries map">
                <g class="country-atlas-land">
                    <path
                        v-for="feature in mapFeatures"
                        :key="feature.id"
                        :d="feature.path"
                        :fill="countryFill(feature.country)"
                        :class="{
                            available: Boolean(feature.country),
                            hovered: hoveredCountry?.name === feature.country?.name,
                            replaced: showHistorical && feature.sovietSuccessor,
                        }"
                        @mousemove="feature.country && showTooltip(feature.country, $event)"
                        @click="feature.country && selectCountry(feature.country)"
                    />
                </g>

                <g v-if="hoveredCountry" class="country-atlas-hover-outline" aria-hidden="true">
                    <path
                        v-for="feature in hoveredFeatures"
                        :key="`hover-${feature.id}`"
                        :d="feature.path"
                    />
                </g>

                <Transition name="historical-layer">
                    <g v-if="showHistorical" class="country-atlas-historical" aria-label="Historical country: Soviet Union">
                        <path
                            class="country-atlas-historical-shape"
                            :d="sovietUnionPath"
                            :fill="historicalCountry ? countryFill(historicalCountry) : '#a55a3a'"
                            @mousemove="historicalCountry && showTooltip(historicalCountry, $event)"
                            @click="historicalCountry && selectCountry(historicalCountry)"
                        />
                    </g>
                </Transition>

                <g class="country-atlas-special-markers">
                    <g
                        v-for="marker in specialMarkers"
                        :key="marker.country.name"
                        :transform="`translate(${marker.x} ${marker.y})`"
                        :style="{ '--marker-color': countryFill(marker.country) }"
                        @mousemove="showTooltip(marker.country, $event)"
                        @click="selectCountry(marker.country)"
                    >
                        <circle class="marker-ring" r="7" />
                        <circle class="marker-core" r="4.5" />
                    </g>
                </g>
                </svg>
            </div>

            <Transition name="map-tooltip">
                <div
                    v-if="hoveredCountry"
                    class="country-atlas-tooltip"
                    :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
                >
                    <span>{{ hoveredCountry.name }}</span>
                    <strong>{{ hoveredCountry.averageVote.toFixed(1) }}</strong>
                    <small>{{ hoveredCountry.films.length }} films · click to open</small>
                </div>
            </Transition>
        </div>

        <footer class="country-atlas-legend">
            <div class="country-atlas-scale">
                <span>{{ mode === "rating" ? "Lower rated" : "Fewer films" }}</span>
                <i :class="mode"></i>
                <span>{{ mode === "rating" ? "Higher rated" : "More films" }}</span>
            </div>
        </footer>
    </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { feature, merge } from "topojson-client";
import { geoEquirectangular, geoPath } from "d3-geo";
import worldAtlas from "world-atlas/countries-110m.json";
import type { FilmAttribute } from "../common/types";

type MapMode = "rating" | "count";
type ViewMode = "world" | "europe";
type Position = [number, number];
type MapFeature = {
    id: string | number;
    path: string;
    name: string;
    country?: FilmAttribute;
    sovietSuccessor: boolean;
};

const props = defineProps<{ countries: FilmAttribute[] }>();
const emit = defineEmits<{ select: [country: FilmAttribute] }>();
const mapRoot = ref<HTMLElement | null>(null);
const mode = ref<MapMode>("rating");
const viewMode = ref<ViewMode>("world");
const timeline = ref<0 | 1>(1);
const hoveredCountry = ref<FilmAttribute | null>(null);
const tooltip = ref({ x: 0, y: 0 });

const aliases: Record<string, string> = {
    "United States": "United States of America",
    "Czech Republic": "Czechia",
    "Republic of Korea": "South Korea",
};
const historicalNames = new Set(["Soviet Union"]);
const sovietSuccessors = new Set([
    "Armenia", "Azerbaijan", "Belarus", "Estonia", "Georgia", "Kazakhstan", "Kyrgyzstan",
    "Latvia", "Lithuania", "Moldova", "Russia", "Tajikistan", "Turkmenistan", "Ukraine", "Uzbekistan",
]);
const ratingColors = [
    "#e93c3c", "#e84d45", "#e75e4d", "#e5805e", "#e0c37f",
    "#a8b97c", "#70af79", "#38a576", "#1ca074", "#009b72",
];

const countryByName = computed(() => new Map(
    props.countries
        .filter((country) => !historicalNames.has(country.name))
        .map((country) => [aliases[country.name] ?? country.name, country]),
));
const historicalCountry = computed(() => props.countries.find((country) => country.name === "Soviet Union"));
const showHistorical = computed(() => timeline.value === 0 && Boolean(historicalCountry.value));
const mappedCountries = computed(() => props.countries.filter((country) => !historicalNames.has(country.name)));
const totalFilms = computed(() => props.countries.reduce((sum, country) => sum + country.films.length, 0));
const maxFilmCount = computed(() => Math.max(...mappedCountries.value.map((country) => country.films.length), 1));
const mapViewBox = computed(() => viewMode.value === "europe"
    ? "370 45 300 120"
    : "0 15 1000 410");

const atlasFeatures = feature(
    worldAtlas as any,
    (worldAtlas as any).objects.countries,
) as any;
const projection = geoEquirectangular()
    .scale(1000 / (2 * Math.PI))
    .translate([500, 250])
    .rotate([-10, 0]);
const pathGenerator = geoPath(projection);
const atlasGeometries = (worldAtlas as any).objects.countries.geometries as any[];

const mapFeatures = computed<MapFeature[]>(() => atlasFeatures.features.flatMap((item: any) => {
    const name = item.properties?.name ?? "";
    const polygons = item.geometry.type === "MultiPolygon"
        ? item.geometry.coordinates
        : [item.geometry.coordinates];
    return polygons.flatMap((coordinates: any, index: number) => {
        const center = polygonCenter(coordinates);
        if (name === "Norway" && center[1] > 74) return [];
        const detachedTerritory = name === "France" && center[0] < -20;
        const geometry = { type: "Polygon", coordinates };
        return [{
            id: `${item.id}-${index}`,
            name,
            path: pathGenerator(geometry as any) ?? "",
            country: detachedTerritory ? undefined : countryByName.value.get(name),
            sovietSuccessor: sovietSuccessors.has(name),
        }];
    });
}));

const sovietUnionGeometry = merge(
    worldAtlas as any,
    atlasGeometries.filter((item) => sovietSuccessors.has(item.properties?.name ?? "")),
);
const sovietUnionPath = pathGenerator(sovietUnionGeometry as any) ?? "";
const hoveredFeatures = computed(() => hoveredCountry.value
    ? mapFeatures.value.filter((item) =>
        item.country?.name === hoveredCountry.value?.name
        && !(showHistorical.value && item.sovietSuccessor))
    : []);
const specialMarkers = computed(() => [
    { name: "Hong Kong", coordinates: [114.17, 22.32] as Position },
].flatMap((marker) => {
    const country = props.countries.find((item) => item.name === marker.name);
    if (!country) return [];
    const [x, y] = project(marker.coordinates);
    return [{ country, x, y }];
}));

function project([longitude, latitude]: Position): Position {
    return projection([longitude, latitude]) as Position;
}

function polygonCenter(coordinates: Position[][]): Position {
    const ring = coordinates[0] ?? [];
    if (!ring.length) return [0, 0];
    const sum = ring.reduce((result, point) => [result[0] + point[0], result[1] + point[1]] as Position, [0, 0] as Position);
    return [sum[0] / ring.length, sum[1] / ring.length];
}

function countryFill(country?: FilmAttribute) {
    if (!country) return "#2a2a2a";
    if (mode.value === "rating") {
        return ratingColors[Math.max(0, Math.min(9, Math.round(country.averageVote) - 1))];
    }
    const intensity = Math.sqrt(country.films.length / maxFilmCount.value);
    return `rgba(255, 91, 27, ${0.2 + intensity * 0.78})`;
}

function showTooltip(country: FilmAttribute, event: MouseEvent) {
    hoveredCountry.value = country;
    const bounds = mapRoot.value?.getBoundingClientRect();
    if (!bounds) return;
    tooltip.value = {
        x: Math.min(event.clientX - bounds.left + 14, bounds.width - 190),
        y: Math.max(event.clientY - bounds.top - 78, 8),
    };
}

function selectCountry(country: FilmAttribute) {
    emit("select", country);
}

</script>

<style lang="sass">
.country-atlas-card
    position: relative
    padding: 1.5rem
    border-radius: 1.5rem
    overflow: hidden
    background: var(--neutral-shade-one)

.country-atlas-header
    position: relative
    z-index: 2
    display: flex
    align-items: flex-start
    justify-content: space-between
    gap: 1rem

    h3
        margin: 0.2rem 0 0
        font-size: 1.6rem

    p
        margin: 0.3rem 0 0
        color: var(--secondary-text-color)

.country-atlas-kicker
    color: var(--kinopoisk-color)
    font-size: 0.7rem
    font-weight: 700
    letter-spacing: 0.12em
    text-transform: uppercase

.country-atlas-controls
    display: flex
    align-items: center
    gap: 0.65rem

.country-atlas-mode,
.country-atlas-view
    display: flex
    padding: 0.25rem
    border-radius: 0.9rem
    background: var(--background-color)

    button
        padding: 0.55rem 0.9rem
        border: 0
        border-radius: 0.7rem
        background: transparent
        color: var(--secondary-text-color)
        cursor: pointer

        &.active
            background: var(--neutral-shade-two)
            color: var(--main-text-color)

.country-atlas-timeline
    position: relative
    z-index: 2
    display: grid
    grid-template-columns: minmax(9rem, auto) minmax(15rem, 28rem)
    align-items: center
    justify-content: space-between
    gap: 1.5rem
    margin-top: 1.25rem
    padding: 0.75rem 0.9rem
    border: 1px solid rgba(255, 255, 255, 0.055)
    border-radius: 1rem
    background: rgba(24, 24, 24, 0.42)

.country-atlas-timeline-copy
    display: flex
    flex-direction: column
    gap: 0.1rem

    span
        color: var(--secondary-text-color)
        font-size: 0.72rem

    strong
        font-size: 0.9rem

.country-atlas-slider-wrap
    position: relative
    display: flex
    flex-direction: column
    gap: 0.45rem

.country-atlas-slider-track
    position: relative
    height: 18px

    &::before
        content: ""
        position: absolute
        top: 8px
        right: 7px
        left: 7px
        height: 2px
        border-radius: 1rem
        background: rgba(255, 255, 255, 0.15)

    &::after
        content: ""
        position: absolute
        top: 5px
        right: 4px
        width: 8px
        height: 8px
        border-radius: 50%
        background: #555

    i
        position: absolute
        z-index: 2
        top: 2px
        left: 0
        width: 14px
        height: 14px
        border: 2px solid #292929
        border-radius: 50%
        background: #ff6a2a
        box-shadow: 0 0 0 1px rgba(255, 106, 42, 0.55), 0 4px 14px rgba(0, 0, 0, 0.4)
        transition: left 0.25s ease, transform 0.25s ease

        &.present
            left: 100%
            transform: translateX(-100%)

    input
        position: absolute
        z-index: 3
        inset: 0
        width: 100%
        height: 18px
        margin: 0
        opacity: 0
        cursor: pointer

.country-atlas-slider-labels
    display: flex
    justify-content: space-between

    button
        display: flex
        flex-direction: column
        gap: 0.05rem
        padding: 0
        border: 0
        background: transparent
        color: var(--secondary-text-color)
        text-align: left
        cursor: pointer

        &:last-child
            text-align: right

        &.active
            color: var(--main-text-color)

        span
            font-size: 0.75rem
            font-weight: 650

        small
            color: var(--secondary-text-color)
            font-size: 0.65rem

.country-atlas-map
    position: relative
    margin: 0.5rem 0 0

.country-atlas-canvas
    overflow: hidden
    border-radius: 1rem

    svg
        display: block
        width: 100%
        max-height: 31rem
        transition: height 0.25s ease

.country-atlas-land path
    stroke: #1f1f1f
    stroke-width: 1.15
    vector-effect: non-scaling-stroke
    transition: fill 0.22s ease, opacity 0.18s ease, filter 0.18s ease

    &.available
        cursor: pointer

        &:hover,
        &.hovered
            opacity: 1
            filter: brightness(1.12)

    &.replaced
        opacity: 0
        pointer-events: none

.country-atlas-hover-outline
    pointer-events: none

    path
        fill: none
        stroke: rgba(255, 255, 255, 0.82)
        stroke-width: 1.25
        vector-effect: non-scaling-stroke

.country-atlas-historical
    .country-atlas-historical-shape
        stroke: none
        vector-effect: non-scaling-stroke
        cursor: pointer
        transition: filter 0.18s ease, opacity 0.18s ease

        &:hover
            filter: brightness(1.12)

.historical-layer-enter-active,
.historical-layer-leave-active
    transition: opacity 0.28s ease

.historical-layer-enter-from,
.historical-layer-leave-to
    opacity: 0

.country-atlas-special-markers g
    cursor: pointer

    .marker-ring
        fill: #202020
        stroke: rgba(255, 255, 255, 0.65)
        stroke-width: 0.9
        filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.28))

    .marker-core
        fill: var(--marker-color)

    &:hover .marker-ring
        stroke: #ffffff

.country-atlas-tooltip
    position: absolute
    z-index: 5
    display: grid
    grid-template-columns: minmax(0, 1fr) auto
    gap: 0.15rem 1rem
    width: 176px
    padding: 0.7rem 0.8rem
    border: 1px solid rgba(255, 255, 255, 0.08)
    border-radius: 0.8rem
    background: rgba(27, 27, 27, 0.94)
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35)
    pointer-events: none
    backdrop-filter: blur(10px)

    span
        overflow: hidden
        font-weight: 650
        text-overflow: ellipsis
        white-space: nowrap

    strong
        color: var(--kinopoisk-color)

    small
        grid-column: 1 / -1
        color: var(--secondary-text-color)

.map-tooltip-enter-active,
.map-tooltip-leave-active
    transition: opacity 0.12s ease, transform 0.12s ease

.map-tooltip-enter-from,
.map-tooltip-leave-to
    opacity: 0
    transform: translateY(4px)

.country-atlas-legend
    display: flex
    align-items: center
    justify-content: space-between
    gap: 1rem
    color: var(--secondary-text-color)
    font-size: 0.75rem

.country-atlas-scale,
.country-atlas-history-key
    display: flex
    align-items: center
    gap: 0.55rem

.country-atlas-scale i
    display: block
    width: 8rem
    height: 0.35rem
    border-radius: 1rem

    &.rating
        background: linear-gradient(90deg, #e84d45, #e0c37f, #009b72)

    &.count
        background: linear-gradient(90deg, rgba(255, 91, 27, 0.2), rgba(255, 91, 27, 0.98))

.country-atlas-history-key i
    width: 1.6rem
    height: 0.7rem
    border: 1px solid #ff8750
    border-radius: 0.2rem
    background: rgba(255, 106, 42, 0.5)

@media (max-width: 700px)
    .country-atlas-card
        padding: 1rem

    .country-atlas-header,
    .country-atlas-legend
        align-items: stretch
        flex-direction: column

    .country-atlas-controls
        align-items: stretch
        flex-direction: column

    .country-atlas-mode,
    .country-atlas-view
        button
            flex: 1

    .country-atlas-timeline
        grid-template-columns: 1fr
        gap: 0.65rem

    .country-atlas-history-key
        display: none
</style>
