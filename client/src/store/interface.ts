import { defineStore } from "pinia";
import { InfoTabStatus } from "../common/types";

interface InterfaceStore {
    infoTabStatus: InfoTabStatus;
    selectedObjectId: number | null;
}

const useInterface = defineStore("interface", {
    state: (): InterfaceStore => ({
        infoTabStatus: InfoTabStatus.None,
        selectedObjectId: null,
    }),
    actions: {
        setInfoTabStatus(status: InfoTabStatus) {
            this.infoTabStatus = status;
        },
        setSelectedObjectId(id: number | null) {
            this.selectedObjectId = id;
        },
    },
});

export default useInterface;
