import { defineStore } from "pinia";
import { roleLabel } from "../shared/utils/role";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    role: "SITE_ADMIN",
  }),
  getters: {
    roleName: (state) => roleLabel(state.role),
  },
  actions: {
    switchRole(role) {
      this.role = role;
    },
  },
  persist: {
    key: "ND_LLM_V1_auth",
  },
});
