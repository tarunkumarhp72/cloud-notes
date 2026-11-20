import React, { useState, useEffect, useRef } from "react";
import styles from "./FindReplaceBar.module.css";

export interface FindReplaceBarProps {
  isOpen: boolean;
  isReplaceOpen: boolean;
  onClose: () => void;
  onToggleReplace: () => void;
  onFindNext: (query: string, matchCase: boolean, wrapAround: boolean) => void;
  onFindPrevious: (query: string, matchCase: boolean, wrapAround: boolean) => void;
  onReplace: (query: string, replacement: string, matchCase: boolean, wrapAround: boolean) => void;
  onReplaceAll: (query: string, replacement: string, matchCase: boolean) => void;
  onQueryChange?: (query: string, matchCase: boolean) => void;
  currentMatch?: number;
  totalMatches?: number;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  isReplaceOpen,
  onClose,
  onToggleReplace,
  onFindNext,
  onFindPrevious,
  onReplace,
  onReplaceAll,
  onQueryChange,
  currentMatch = 0,
  totalMatches = 0,
}) => {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wrapAround, setWrapAround] = useState(true);

  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Focus find input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        findInputRef.current?.focus();
        findInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Focus replace input if toggle opens replace
  useEffect(() => {
    if (isOpen && isReplaceOpen) {
      setTimeout(() => {
        replaceInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isReplaceOpen]);

  // Notify parent on query or matchCase change
  useEffect(() => {
    onQueryChange?.(query, matchCase);
  }, [query, matchCase, onQueryChange]);

  if (!isOpen) return null;

  const handleFindKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onFindPrevious(query, matchCase, wrapAround);
      } else {
        onFindNext(query, matchCase, wrapAround);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onReplace(query, replacement, matchCase, wrapAround);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let matchText = "";
  if (query.length > 0) {
    if (totalMatches === 0) {
      matchText = "0/0";
    } else {
      matchText = `${currentMatch || 1}/${totalMatches}`;
    }
  }

  return (
    <div
      className={styles.findReplaceContainer}
      role="region"
      aria-label="Find and replace"
    >
      {/* Row 1: Find */}
      <div className={styles.row}>
        {/* Toggle Replace Chevron */}
        <button
          type="button"
          className={`${styles.iconButton} ${isReplaceOpen ? styles.active : ""}`}
          onClick={onToggleReplace}
          title={isReplaceOpen ? "Hide replace" : "Show replace"}
          aria-expanded={isReplaceOpen}
          aria-label="Toggle replace"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{
              transform: isReplaceOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          >
            <path d="M6 3.5l5 4.5-5 4.5V3.5z" />
          </svg>
        </button>

        {/* Query Input */}
        <div className={styles.inputWrapper}>
          <input
            ref={findInputRef}
            type="text"
            className={styles.input}
            placeholder="Find"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleFindKeyDown}
            aria-label="Find query"
          />
          {matchText && <span className={styles.matchCount}>{matchText}</span>}
        </div>

        {/* Previous Match */}
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onFindPrevious(query, matchCase, wrapAround)}
          title="Previous match (Shift+F3)"
          aria-label="Previous match"
          disabled={!query || totalMatches === 0}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4.5l5 5H3l5-5z" />
          </svg>
        </button>

        {/* Next Match */}
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onFindNext(query, matchCase, wrapAround)}
          title="Next match (F3)"
          aria-label="Next match"
          disabled={!query || totalMatches === 0}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 11.5l-5-5h10l-5 5z" />
          </svg>
        </button>

        <div className={styles.separator} />

        {/* Match Case Toggle */}
        <button
          type="button"
          className={`${styles.iconButton} ${matchCase ? styles.active : ""}`}
          onClick={() => setMatchCase((v) => !v)}
          title="Match case"
          aria-pressed={matchCase}
          aria-label="Match case"
        >
          <span style={{ fontWeight: 600, fontSize: "11px", letterSpacing: "-0.5px" }}>Aa</span>
        </button>

        {/* Wrap Around Toggle */}
        <button
          type="button"
          className={`${styles.iconButton} ${wrapAround ? styles.active : ""}`}
          onClick={() => setWrapAround((v) => !v)}
          title="Wrap around"
          aria-pressed={wrapAround}
          aria-label="Wrap around"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4.5a3.5 3.5 0 0 1 6-2.45V1l3.5 3-3.5 3V5.5A2.5 2.5 0 0 0 5.5 8H4a4 4 0 0 1 4-4h.5" />
            <path d="M14 11.5a3.5 3.5 0 0 1-6 2.45V15l-3.5-3 3.5-3v1.5A2.5 2.5 0 0 0 10.5 8H12a4 4 0 0 1-4 4h-.5" />
          </svg>
        </button>

        <div className={styles.separator} />

        {/* Close Button */}
        <button
          type="button"
          className={styles.iconButton}
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close find and replace"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z" />
          </svg>
        </button>
      </div>

      {/* Row 2: Replace */}
      {isReplaceOpen && (
        <div className={styles.row} style={{ paddingLeft: "34px" }}>
          <div className={styles.inputWrapper}>
            <input
              ref={replaceInputRef}
              type="text"
              className={styles.input}
              placeholder="Replace"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              aria-label="Replace with"
            />
          </div>

          <button
            type="button"
            className={styles.actionButton}
            onClick={() => onReplace(query, replacement, matchCase, wrapAround)}
            disabled={!query || totalMatches === 0}
          >
            Replace
          </button>

          <button
            type="button"
            className={styles.actionButton}
            onClick={() => onReplaceAll(query, replacement, matchCase)}
            disabled={!query || totalMatches === 0}
          >
            Replace all
          </button>
        </div>
      )}
    </div>
  );
};
