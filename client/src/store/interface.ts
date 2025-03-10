import { defineStore } from "pinia";
import { InfoTabStatus } from "../common/types";

interface InterfaceStore {
    infoTabStatus: InfoTabStatus;
}

const useInterface = defineStore("interface", {
    state: (): InterfaceStore => ({
        infoTabStatus: InfoTabStatus.None,
    }),
    actions: {
        setInfoTabStatus(status: InfoTabStatus) {
            this.infoTabStatus = status;
        },
    },
});

export default useInterface;
