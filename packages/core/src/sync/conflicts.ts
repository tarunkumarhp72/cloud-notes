export interface NoteVersionInfo {
  id: string;
  title: string;
  content: string;
  isMarkdown: boolean;
  version: number;
  updatedAt: string;
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  winner: NoteVersionInfo;
  loser: NoteVersionInfo | null;
  conflictTabTitle: string | null;
}

/**
 * Evaluates local and remote note states to detect concurrent modification divergence.
 * If local has un-synced edits and remote has concurrent updates with divergent contents,
 * a conflict is flagged and resolved without data loss:
 * 1. The winning version is designated for the primary note.
 * 2. The losing version is branched into a dedicated conflict note titled "[Note Name] - conflict".
 */
export function detectNoteConflict(
  local: NoteVersionInfo,
  remote: NoteVersionInfo,
  isLocalDirty: boolean = true
): ConflictDetectionResult {
  // If contents and titles are identical, no divergence occurred
  if (local.content === remote.content && local.title === remote.title) {
    return {
      hasConflict: false,
      winner: remote,
      loser: null,
      conflictTabTitle: null,
    };
  }

  // If local has no unsaved changes, the remote update cleanly applies
  if (!isLocalDirty) {
    return {
      hasConflict: false,
      winner: remote,
      loser: null,
      conflictTabTitle: null,
    };
  }

  // Both local and remote have diverged!
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();

  // Deterministic timestamp arbitration (remote wins ties or newer timestamps)
  const remoteWins = remoteTime >= localTime;
  const winner = remoteWins ? remote : local;
  const loser = remoteWins ? local : remote;

  const baseTitle = winner.title.trim() || "Untitled";

  return {
    hasConflict: true,
    winner,
    loser,
    conflictTabTitle: `${baseTitle} - conflict`,
  };
}
