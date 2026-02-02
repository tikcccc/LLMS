import { defineStore } from "pinia";
import { nowIso } from "../shared/utils/time";

const seedWorkLots = () => [
  {
    id: "WL-2025-001",
    operatorName: "Sunrise Logistics",
    type: "Business",
    status: "In-Progress",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [834900, 815700],
          [835100, 815700],
          [835100, 815900],
          [834900, 815900],
          [834900, 815700],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
  {
    id: "WL-2025-002",
    operatorName: "Harbor Kitchen",
    type: "Household",
    status: "Pending",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [835350, 815760],
          [835550, 815760],
          [835550, 815940],
          [835350, 815940],
          [835350, 815760],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
];

export const useWorkLotStore = defineStore("workLots", {
  state: () => ({
    workLots: [],
  }),
  actions: {
    seedIfEmpty() {
      if (this.workLots.length === 0) {
        this.workLots = seedWorkLots();
      }
    },
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
