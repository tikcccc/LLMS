export const useMapKeyboardShortcuts = ({
  uiStore,
  canEditLayer,
  setTool,
  cancelTool,
}) => {
  const handleKeydown = (event) => {
    const target = event.target;
    const isInputTarget =
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    if (isInputTarget) return;

    if (event.key === "Escape" && uiStore.tool !== "PAN") {
      cancelTool();
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "v") {
      setTool("PAN");
      return;
    }
    if (key === "l") {
      setTool("MEASURE");
      return;
    }
    if (key === "d") {
      setTool("DRAW");
      return;
    }
    if (key === "c") {
      setTool("DRAW_CIRCLE");
      return;
    }
    if (!canEditLayer.value) return;
    if (key === "p") {
      setTool("POLYGON");
      return;
    }
    if (key === "o") {
      setTool("POLYGON_CIRCLE");
      return;
    }
    if (key === "m") {
      setTool("MODIFY");
      return;
    }
    if (key === "x") {
      setTool("DELETE");
    }
  };

  return {
    handleKeydown,
  };
};
