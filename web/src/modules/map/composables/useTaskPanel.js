import { computed, ref, watch } from "vue";
import { buildUserOptions, getDefaultAssignee } from "../../../shared/mock/users";
import { isOverdue } from "../utils/taskUtils";

export const useTaskPanel = ({
  authStore,
  workLotStore,
  taskStore,
  uiStore,
  selectedWorkLot,
}) => {
  const leftTab = ref("layers");
  const taskFilter = ref("All");
  const searchQuery = ref("");
  const workSearchQuery = ref("");
  const selectedTaskId = ref(null);
  const showTaskDialog = ref(false);
  const taskForm = ref({
    title: "",
    assignee: "",
    dueDate: "",
    description: "",
    status: "Open",
  });

  const newTaskTitle = ref("");
  const newTaskAssignee = ref("");
  const newTaskDueDate = ref("");
  const newTaskDescription = ref("");

  const assigneeOptions = computed(() => {
    const baseOptions = buildUserOptions();
    const knownNames = new Set(baseOptions.map((option) => option.value));
    const extraNames = new Set(
      taskStore.tasks.map((task) => task.assignee).filter(Boolean)
    );
    if (authStore.roleName) extraNames.add(authStore.roleName);
    const extraOptions = Array.from(extraNames)
      .filter((name) => !knownNames.has(name))
      .map((name) => ({ label: name, value: name, name }));
    return [...baseOptions, ...extraOptions];
  });

  const selectedTasks = computed(() =>
    taskStore.tasks.filter((task) => task.workLotId === uiStore.selectedWorkLotId)
  );

  const selectedTask = computed(() =>
    taskStore.tasks.find((task) => task.id === selectedTaskId.value) || null
  );

  const searchResults = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) {
      return workLotStore.workLots.slice(0, 6);
    }
    return workLotStore.workLots
      .filter(
        (lot) =>
          lot.operatorName.toLowerCase().includes(query) ||
          lot.id.toLowerCase().includes(query)
      )
      .slice(0, 8);
  });

  const filteredTasks = computed(() => {
    if (taskFilter.value === "All") return taskStore.tasks;
    if (taskFilter.value === "Overdue") {
      return taskStore.tasks.filter((task) => isOverdue(task));
    }
    return taskStore.tasks.filter((task) => task.status === taskFilter.value);
  });

  const workLotResults = computed(() => {
    const query = workSearchQuery.value.trim().toLowerCase();
    if (!query) return workLotStore.workLots.slice(0, 8);
    return workLotStore.workLots.filter(
      (lot) =>
        lot.operatorName.toLowerCase().includes(query) ||
        lot.id.toLowerCase().includes(query)
    );
  });

  const workLotName = (id) => {
    const lot = workLotStore.workLots.find((item) => item.id === id);
    return lot ? lot.operatorName : id;
  };

  const addTask = () => {
    if (!selectedWorkLot.value) return;
    const title = newTaskTitle.value.trim();
    if (!title) return;
    taskStore.addTask(
      selectedWorkLot.value.id,
      title,
      newTaskAssignee.value ||
        getDefaultAssignee(authStore.role) ||
        authStore.roleName,
      {
        dueDate: newTaskDueDate.value,
        description: newTaskDescription.value,
      }
    );
    clearNewTask();
  };

  const clearNewTask = () => {
    newTaskTitle.value = "";
    newTaskAssignee.value = "";
    newTaskDueDate.value = "";
    newTaskDescription.value = "";
  };

  const openAddTaskDialog = () => {
    if (!selectedWorkLot.value) return;
    if (!newTaskAssignee.value) {
      newTaskAssignee.value =
        getDefaultAssignee(authStore.role) || authStore.roleName;
    }
    if (!newTaskDescription.value) {
      newTaskDescription.value = "";
    }
    showTaskDialog.value = true;
  };

  const confirmAddTask = () => {
    addTask();
    showTaskDialog.value = false;
  };

  const selectTask = (taskId) => {
    selectedTaskId.value = taskId;
  };

  const clearTaskSelection = () => {
    selectedTaskId.value = null;
  };

  const resetTaskForm = () => {
    if (!selectedTask.value) return;
    taskForm.value = {
      title: selectedTask.value.title,
      assignee: selectedTask.value.assignee,
      dueDate: selectedTask.value.dueDate,
      description: selectedTask.value.description || "",
      status: selectedTask.value.status,
    };
  };

  const saveTaskDetail = () => {
    if (!selectedTask.value) return;
    taskStore.updateTask(selectedTask.value.id, { ...taskForm.value });
  };

  const deleteTask = () => {
    if (!selectedTask.value) return;
    taskStore.removeTask(selectedTask.value.id);
    selectedTaskId.value = null;
  };

  watch(
    () => uiStore.selectedWorkLotId,
    () => {
      selectedTaskId.value = null;
    }
  );

  watch(
    () => selectedTaskId.value,
    (value) => {
      if (!value) return;
      resetTaskForm();
    }
  );

  return {
    leftTab,
    taskFilter,
    searchQuery,
    workSearchQuery,
    selectedTaskId,
    selectedTasks,
    selectedTask,
    showTaskDialog,
    taskForm,
    assigneeOptions,
    newTaskTitle,
    newTaskAssignee,
    newTaskDueDate,
    newTaskDescription,
    searchResults,
    filteredTasks,
    workLotResults,
    workLotName,
    addTask,
    clearNewTask,
    openAddTaskDialog,
    confirmAddTask,
    selectTask,
    clearTaskSelection,
    resetTaskForm,
    saveTaskDetail,
    deleteTask,
  };
};
