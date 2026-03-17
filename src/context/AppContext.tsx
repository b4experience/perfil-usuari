'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Locale,
  Discipline,
  UserConsent,
  SliderValues,
  TrialResponse,
  ICDResult,
} from '@/types'

interface AppState {
  // ─── Locale ──────────────────────────────────────────────────────────────
  locale: Locale
  setLocale: (l: Locale) => void

  // ─── User name (test mode) ────────────────────────────────────────────────
  userName: string
  setUserName: (n: string) => void

  // ─── Selected discipline ─────────────────────────────────────────────────
  selectedDiscipline: Discipline | null
  setDiscipline: (d: Discipline) => void

  // ─── Onboarding steps ────────────────────────────────────────────────────
  consent: UserConsent | null
  setConsent: (c: UserConsent) => void

  sliders: SliderValues | null
  setSliders: (s: SliderValues) => void

  // ─── Test responses ───────────────────────────────────────────────────────
  testResponses: TrialResponse[]
  addResponse: (r: TrialResponse) => void
  clearResponses: () => void

  // ─── Results ──────────────────────────────────────────────────────────────
  icdResult: ICDResult | null
  setICDResult: (r: ICDResult) => void

  // ─── Reset full onboarding ────────────────────────────────────────────────
  resetOnboarding: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale) => set({ locale }),

      userName: '',
      setUserName: (userName) => set({ userName }),

      selectedDiscipline: null,
      setDiscipline: (selectedDiscipline) => set({ selectedDiscipline }),

      consent: null,
      setConsent: (consent) => set({ consent }),

      sliders: null,
      setSliders: (sliders) => set({ sliders }),

      testResponses: [],
      addResponse: (r) =>
        set((state) => ({ testResponses: [...state.testResponses, r] })),
      clearResponses: () => set({ testResponses: [] }),

      icdResult: null,
      setICDResult: (icdResult) => set({ icdResult }),

      resetOnboarding: () =>
        set({
          selectedDiscipline: null,
          consent: null,
          sliders: null,
          testResponses: [],
          icdResult: null,
        }),
    }),
    {
      name: 'b4e-app-state',
      storage: createJSONStorage(() => sessionStorage),
      // Do NOT persist test responses or results to localStorage for privacy
      partialize: (state) => ({
        locale:             state.locale,
        userName:           state.userName,
        selectedDiscipline: state.selectedDiscipline,
        consent:            state.consent,
        sliders:            state.sliders,
      }),
    },
  ),
)
