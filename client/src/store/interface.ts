import { defineStore } from "pinia";
import { InfoTabStatus, type FilmListSelection } from "../common/types";

interface InterfaceStore {
    infoTabStatus: InfoTabStatus;
    selectedObjectId: number | null;
    filmListSelection: FilmListSelection | null;
}

const useInterface = defineStore("interface", {
    state: (): InterfaceStore => ({
        infoTabStatus: InfoTabStatus.None,
        selectedObjectId: null,
        filmListSelection: null,
    }),
    actions: {
        setInfoTabStatus(status: InfoTabStatus) {
            this.infoTabStatus = status;
        },
        setSelectedObjectId(id: number | null) {
            this.selectedObjectId = id;
        },
        setNoneInfoTab() {
            this.infoTabStatus = InfoTabStatus.None;
            this.selectedObjectId = null;
            this.filmListSelection = null;
        },
        setInfoTab(status: InfoTabStatus, objectId: number | null) {
            this.infoTabStatus = status;
            this.selectedObjectId = objectId;
            this.filmListSelection = null;
        },
        setFilmList(selection: FilmListSelection) {
            this.infoTabStatus = InfoTabStatus.FilmList;
            this.selectedObjectId = null;
            this.filmListSelection = selection;
        },
    },
});

export default useInterface;
