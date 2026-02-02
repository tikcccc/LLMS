import { defineStore } from "pinia";
import { nowIso } from "../shared/utils/time";
import { generateId } from "../shared/utils/id";

export const useRelationStore = defineStore("relations", {
  state: () => ({
    relations: [],
  }),
  actions: {
    seedIfEmpty(landLots = [], workLots = []) {
      if (this.relations.length > 0) return;

      const legacyRelations = [];
      workLots.forEach((workLot) => {
        if (Array.isArray(workLot.relatedLandLots)) {
          workLot.relatedLandLots.forEach((landLotId) => {
            legacyRelations.push({
              landLotId,
              workLotId: workLot.id,
              source: "legacy",
              confidence: 0.8,
              updatedBy: "Seed",
              updatedAt: nowIso(),
            });
          });
        }
      });

      if (legacyRelations.length > 0) {
        this.relations = legacyRelations.map((rel) => ({
          id: generateId("REL"),
          ...rel,
        }));
        return;
      }

      if (landLots.length === 0 || workLots.length === 0) return;

      const seeded = workLots.map((workLot, index) => ({
        id: generateId("REL"),
        landLotId: landLots[index % landLots.length].id,
        workLotId: workLot.id,
        source: "seed",
        confidence: 0.6,
        updatedBy: "Seed",
        updatedAt: nowIso(),
      }));

      this.relations = seeded;
    },
    addRelation({ landLotId, workLotId, source = "manual", confidence = 1, updatedBy = "System" }) {
      const exists = this.relations.some(
        (rel) => rel.landLotId === landLotId && rel.workLotId === workLotId
      );
      if (exists) return;
      this.relations.push({
        id: generateId("REL"),
        landLotId,
        workLotId,
        source,
        confidence,
        updatedBy,
        updatedAt: nowIso(),
      });
    },
    replaceRelationsForWorkLot(workLotId, landLotIds, updatedBy = "System", source = "spatial") {
      this.relations = this.relations.filter((rel) => rel.workLotId !== workLotId);
      landLotIds.forEach((landLotId) => {
        this.addRelation({ landLotId, workLotId, source, confidence: 0.9, updatedBy });
      });
    },
    replaceRelationsForLandLot(landLotId, workLotIds, updatedBy = "System", source = "spatial") {
      this.relations = this.relations.filter((rel) => rel.landLotId !== landLotId);
      workLotIds.forEach((workLotId) => {
        this.addRelation({ landLotId, workLotId, source, confidence: 0.9, updatedBy });
      });
    },
    removeRelationsByWorkLot(workLotId) {
      this.relations = this.relations.filter((rel) => rel.workLotId !== workLotId);
    },
    removeRelationsByLandLot(landLotId) {
      this.relations = this.relations.filter((rel) => rel.landLotId !== landLotId);
    },
  },
  persist: {
    key: "ND_LLM_V1_relations",
  },
});
