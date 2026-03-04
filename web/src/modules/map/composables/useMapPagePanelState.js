import { ref } from "vue";

export const useMapPagePanelState = () => {
  const leftTab = ref("layers");
  const workSearchQuery = ref("");
  const siteBoundarySearchQuery = ref("");
  const partOfSitesSearchQuery = ref("");
  const sectionSearchQuery = ref("");

  const siteBoundarySourceVersion = ref(0);
  const partOfSitesSourceVersion = ref(0);
  const sectionSourceVersion = ref(0);

  return {
    leftTab,
    workSearchQuery,
    siteBoundarySearchQuery,
    partOfSitesSearchQuery,
    sectionSearchQuery,
    siteBoundarySourceVersion,
    partOfSitesSourceVersion,
    sectionSourceVersion,
  };
};
