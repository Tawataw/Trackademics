sed -i "s/import { create } from 'zustand';/import { create } from 'zustand';\nimport { dbApi } from '..\/lib\/db';/" src/store/useTrackerStore.ts
