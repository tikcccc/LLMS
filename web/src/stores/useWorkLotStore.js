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
  {
    id: "WL-2025-003",
    operatorName: "Metro Retail",
    type: "Business",
    status: "Handover",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [835950, 815620],
          [836150, 815620],
          [836150, 815820],
          [835950, 815820],
          [835950, 815620],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
  {
    id: "WL-2025-004",
    operatorName: "Hilltop Residents",
    type: "Household",
    status: "Difficult",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [834320, 816140],
          [834520, 816140],
          [834520, 816320],
          [834320, 816320],
          [834320, 816140],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
  {
    id: "WL-2025-005",
    operatorName: "Garden Community",
    type: "Household",
    status: "In-Progress",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [834650, 815480],
          [834900, 815480],
          [834900, 815700],
          [834650, 815700],
          [834650, 815480],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
  {
    id: "WL-2025-006",
    operatorName: "Ocean View Plaza",
    type: "Business",
    status: "In-Progress",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [835600, 816100],
          [835800, 816100],
          [835800, 816280],
          [835600, 816280],
          [835600, 816100],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
  {
    id: "WL-2025-007",
    operatorName: "Peak Residence",
    type: "Household",
    status: "Pending",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [836200, 815900],
          [836400, 815900],
          [836400, 816080],
          [836200, 816080],
          [836200, 815900],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
  {
    id: "WL-2025-008",
    operatorName: "Valley Market",
    type: "Business",
    status: "Handover",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [834500, 815200],
          [834700, 815200],
          [834700, 815380],
          [834500, 815380],
          [834500, 815200],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
  {
    id: "WL-2025-009",
    operatorName: "Riverside Apartments",
    type: "Household",
    status: "In-Progress",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [835150, 815400],
          [835350, 815400],
          [835350, 815580],
          [835150, 815580],
          [835150, 815400],
        ],
      ],
    },
    updatedBy: "Site Officer",
    updatedAt: nowIso(),
  },
  {
    id: "WL-2025-010",
    operatorName: "Central Tower",
    type: "Business",
    status: "Difficult",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [835700, 815500],
          [835900, 815500],
          [835900, 815680],
          [835700, 815680],
          [835700, 815500],
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
