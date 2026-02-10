import { defineStore } from "pinia";
import { normalizeWorkLot } from "../shared/utils/worklot";

export const useWorkLotStore = defineStore("workLots", {
  state: () => ({
    workLots: [],
  }),
  actions: {
    normalizeLegacyWorkLots() {
      this.workLots = this.workLots.map((lot) => normalizeWorkLot(lot));
    },
    addWorkLot(lot) {
      this.workLots.push(normalizeWorkLot(lot));
    },
    updateWorkLot(id, payload) {
      const index = this.workLots.findIndex((lot) => lot.id === id);
      if (index !== -1) {
        this.workLots[index] = normalizeWorkLot({
          ...this.workLots[index],
          ...payload,
        });
      }
    },
    removeWorkLot(id) {
      this.workLots = this.workLots.filter((lot) => lot.id !== id);
    },
  },
  persist: {
    key: "ND_LLM_V1_worklots",
  },
});
