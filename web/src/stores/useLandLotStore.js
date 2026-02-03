import { defineStore } from "pinia";
import { nowIso } from "../shared/utils/time";

const seedLandLots = () => [
  {
    id: "LL-001",
    lotNumber: "D.D. 99 Lot 123 RP",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [834800, 815600],
          [835200, 815600],
          [835200, 816000],
          [834800, 816000],
          [834800, 815600],
        ],
      ],
    },
    status: "Active",
    updatedBy: "Site Admin",
    updatedAt: nowIso(),
  },
  {
    id: "LL-002",
    lotNumber: "D.D. 99 Lot 126 RP",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [835300, 815700],
          [835650, 815700],
          [835650, 816050],
          [835300, 816050],
          [835300, 815700],
        ],
      ],
    },
    status: "Active",
    updatedBy: "Site Admin",
    updatedAt: nowIso(),
  },
  {
    id: "LL-003",
    lotNumber: "D.D. 100 Lot 201 RP",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [835800, 815500],
          [836250, 815500],
          [836250, 815900],
          [835800, 815900],
          [835800, 815500],
        ],
      ],
    },
    status: "Active",
    updatedBy: "Site Admin",
    updatedAt: nowIso(),
  },
  {
    id: "LL-004",
    lotNumber: "D.D. 100 Lot 205 RP",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [834200, 816050],
          [834650, 816050],
          [834650, 816450],
          [834200, 816450],
          [834200, 816050],
        ],
      ],
    },
    status: "Inactive",
    updatedBy: "Site Admin",
    updatedAt: nowIso(),
  },
];

export const useLandLotStore = defineStore("landLots", {
  state: () => ({
    landLots: [],
  }),
  actions: {
    seedIfEmpty() {
      if (this.landLots.length === 0) {
        this.landLots = seedLandLots();
      }
    },
    addLandLot(lot) {
      this.landLots.push(lot);
    },
    updateLandLot(id, payload) {
      const index = this.landLots.findIndex((lot) => lot.id === id);
      if (index !== -1) {
        this.landLots[index] = { ...this.landLots[index], ...payload };
      }
    },
    removeLandLot(id) {
      this.landLots = this.landLots.filter((lot) => lot.id !== id);
    },
  },
  persist: {
    key: "ND_LLM_V1_landlots",
  },
});
