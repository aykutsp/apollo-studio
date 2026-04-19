import { create } from "zustand";

type CameraState = {
  pos: [number, number, number];
  target: [number, number, number];
  autoHideWalls: boolean;
  showCamera2D: boolean;
  timeOfDay: number; // 6.0 to 20.0
  setCam: (pos: [number, number, number], target: [number, number, number]) => void;
  setAutoHideWalls: (val: boolean) => void;
  setShowCamera2D: (val: boolean) => void;
  setTimeOfDay: (val: number) => void;
};

export const useCameraStore = create<CameraState>((set) => ({
  pos: [6, 20, 20],
  target: [6, 1, 6],
  autoHideWalls: true,
  showCamera2D: true,
  timeOfDay: 14.0, // Default 2 PM
  setCam: (pos, target) => set({ pos, target }),
  setAutoHideWalls: (autoHideWalls) => set({ autoHideWalls }),
  setShowCamera2D: (showCamera2D) => set({ showCamera2D }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
}));

