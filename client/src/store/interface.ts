import { defineStore } from "pinia";
import { InfoTabStatus } from "../common/types";

interface InterfaceStore {
    infoTabStatus: InfoTabStatus;
    selectedPersonId: number | null;
}

const useInterface = defineStore("interface", {
    state: (): InterfaceStore => ({
        infoTabStatus: InfoTabStatus.None,
        selectedPersonId: null,
    }),
    actions: {
        setInfoTabStatus(status: InfoTabStatus) {
            this.infoTabStatus = status;
        },
        setSelectedPersonId(id: number | null) {
            this.selectedPersonId = id;
        },
    },
});

export default useInterface;
