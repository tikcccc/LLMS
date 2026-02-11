import { defineStore } from "pinia";
import { normalizeWorkLot } from "../shared/utils/worklot";
import { generateWorkLotId, isWorkLotId } from "../shared/utils/id";

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const ensureWorkLotId = (lot, existingIds = new Set()) => {
  const currentId = normalizeText(lot?.id);
  const normalizedExistingIds = new Set(
    Array.from(existingIds).map((value) => normalizeText(value).toLowerCase())
  );
  if (isWorkLotId(currentId) && !normalizedExistingIds.has(currentId.toLowerCase())) {
    normalizedExistingIds.add(currentId.toLowerCase());
    return currentId;
  }
  const generatedId = generateWorkLotId(lot?.category, normalizedExistingIds);
  normalizedExistingIds.add(generatedId.toLowerCase());
  return generatedId;
};

export const useWorkLotStore = defineStore("workLots", {
  state: () => ({
    workLots: [],
  }),
  actions: {
    normalizeLegacyWorkLots() {
      this.replaceWorkLots(this.workLots);
    },
    replaceWorkLots(workLots = []) {
      const existingIds = new Set();
      this.workLots = (Array.isArray(workLots) ? workLots : []).map((lot) => {
        const normalized = normalizeWorkLot(lot);
        const id = ensureWorkLotId(normalized, existingIds);
        existingIds.add(id.toLowerCase());
        return normalizeWorkLot({
          ...normalized,
          id,
        });
      });
    },
    addWorkLot(lot) {
      const existingIds = new Set(this.workLots.map((item) => item.id));
      const normalized = normalizeWorkLot(lot);
      const id = ensureWorkLotId(normalized, existingIds);
      this.workLots.push(
        normalizeWorkLot({
          ...normalized,
          id,
        })
      );
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
