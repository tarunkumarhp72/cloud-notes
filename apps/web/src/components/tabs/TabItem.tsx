import React, { useState } from "react";
import styles from "./TabStrip.module.css";
import { Tab } from "./TabStrip";
import { Tooltip } from "../ui/Tooltip";

export interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  index: number;
  onSelect: () => void;
  onClose: () => void;
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;
}

export const TabItem: React.FC<TabItemProps> = ({
  tab,
  isActive,
  index,
  onSelect,
  onClose,
  onReorder,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (!isNaN(sourceIndex) && sourceIndex !== index && onReorder) {
      onReorder(sourceIndex, index);
    }
  };

  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${styles.tab} ${isActive ? styles.active : ""}`}
      style={{
        outline: isDragOver ? "2px dashed var(--accent-primary)" : undefined,
        outlineOffset: isDragOver ? "-2px" : undefined,
      }}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className={styles.tabTitle} title={tab.title}>
        {tab.title}
      </span>

      {(tab.hasUnsavedChanges !== undefined ? tab.hasUnsavedChanges : tab.isDirty) && (
        <span className={styles.dirtyDot} title="Unsaved changes" aria-label="Unsaved changes" />
      )}

      <Tooltip content="Close tab (Ctrl+W)" position="bottom">
        <button
          type="button"
          className={styles.closeBtn}
          aria-label={`Close tab ${tab.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ×
        </button>
      </Tooltip>
    </div>
  );
};
