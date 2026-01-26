import { create } from "zustand";

interface GenerationState {
  // Single scene generation
  generatingSceneId: string | null;
  generatingSceneProgress: string | null;

  // Batch generation (chapter-level)
  batchGenerating: boolean;
  batchChapterId: string | null;
  batchSceneIds: string[];
  batchCurrentIndex: number;
  batchErrors: { sceneId: string; error: string }[];
  batchSkipExisting: boolean;
  batchCancelled: boolean;

  // Actions
  startSceneGeneration: (sceneId: string) => void;
  updateSceneProgress: (progress: string) => void;
  endSceneGeneration: () => void;

  startBatchGeneration: (
    chapterId: string,
    sceneIds: string[],
    skipExisting: boolean
  ) => void;
  advanceBatchIndex: () => void;
  addBatchError: (sceneId: string, error: string) => void;
  cancelBatchGeneration: () => void;
  endBatchGeneration: () => void;
  resetBatch: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  // Initial state
  generatingSceneId: null,
  generatingSceneProgress: null,
  batchGenerating: false,
  batchChapterId: null,
  batchSceneIds: [],
  batchCurrentIndex: 0,
  batchErrors: [],
  batchSkipExisting: false,
  batchCancelled: false,

  // Single scene actions
  startSceneGeneration: (sceneId) =>
    set({
      generatingSceneId: sceneId,
      generatingSceneProgress: null,
    }),

  updateSceneProgress: (progress) =>
    set({
      generatingSceneProgress: progress,
    }),

  endSceneGeneration: () =>
    set({
      generatingSceneId: null,
      generatingSceneProgress: null,
    }),

  // Batch generation actions
  startBatchGeneration: (chapterId, sceneIds, skipExisting) =>
    set({
      batchGenerating: true,
      batchChapterId: chapterId,
      batchSceneIds: sceneIds,
      batchCurrentIndex: 0,
      batchErrors: [],
      batchSkipExisting: skipExisting,
      batchCancelled: false,
    }),

  advanceBatchIndex: () =>
    set((state) => ({
      batchCurrentIndex: state.batchCurrentIndex + 1,
    })),

  addBatchError: (sceneId, error) =>
    set((state) => ({
      batchErrors: [...state.batchErrors, { sceneId, error }],
    })),

  cancelBatchGeneration: () =>
    set({
      batchCancelled: true,
    }),

  endBatchGeneration: () =>
    set({
      batchGenerating: false,
      generatingSceneId: null,
      generatingSceneProgress: null,
    }),

  resetBatch: () =>
    set({
      batchGenerating: false,
      batchChapterId: null,
      batchSceneIds: [],
      batchCurrentIndex: 0,
      batchErrors: [],
      batchSkipExisting: false,
      batchCancelled: false,
    }),
}));
