import { defineStore } from "pinia";

export const useWorkLotStore = defineStore("workLots", {
  state: () => ({
    workLots: [],
  }),
  actions: {
    addWorkLot(lot) {
      this.workLots.push(lot);
    },
    updateWorkLot(id, payload) {
      const index = this.workLots.findIndex((lot) => lot.id === id);
      if (index !== -1) {
        this.workLots[index] = { ...this.workLots[index], ...payload };
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
