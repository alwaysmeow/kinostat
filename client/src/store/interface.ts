import { defineStore } from "pinia";
import { TabStatus } from "../types/types";

interface InterfaceStore {
    tabStatus: TabStatus;
}

const useInterface = defineStore("interface", {
    state: (): InterfaceStore => ({
        tabStatus: TabStatus.None,
    }),
    actions: {
        setTabStatus(status: TabStatus) {
            this.tabStatus = status;
        },
    },
});

export default useInterface;
