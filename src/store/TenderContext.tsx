import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  TenderData,
  UploadedFile,
  RequirementMatch,
} from '../types/tender';

export interface TenderState {
  tenderData: TenderData | null;
  uploadedFiles: UploadedFile[];
  matches: RequirementMatch[];
}

// ── Actions ──────────────────────────────────────────────────────────
export type TenderAction =
  | { type: 'LOAD_TENDER'; payload: TenderData }
  | { type: 'ADD_FILES'; payload: UploadedFile[] }
  | { type: 'REMOVE_FILE'; payload: string } // fileId
  | { type: 'MATCH_FILE'; payload: { requirementId: string; fileId: string } }
  | { type: 'UNMATCH'; payload: string } // requirementId
  | { type: 'SET_EXPIRY'; payload: { requirementId: string; date: string } }
  | { type: 'MARK_DUPLICATES' }
  | { type: 'AUTO_MATCH' };

const initialState: TenderState = {
  tenderData: null,
  uploadedFiles: [],
  matches: [],
};

function reducer(state: TenderState, action: TenderAction): TenderState {
  switch (action.type) {
    case 'LOAD_TENDER': {
      // Initialize matches for all requirements
      const matches: RequirementMatch[] = action.payload.requirements.map(
        (r) => ({ requirementId: r.id, fileId: null, expiryDate: null })
      );
      return {
        ...state,
        tenderData: action.payload,
        matches,
        uploadedFiles: [],
      };
    }

    case 'ADD_FILES': {
      const newFiles = [...state.uploadedFiles, ...action.payload];
      return markDuplicates({ ...state, uploadedFiles: newFiles });
    }

    case 'REMOVE_FILE': {
      const fileId = action.payload;
      // Also clear any match using this file
      const matches = state.matches.map((m) =>
        m.fileId === fileId ? { ...m, fileId: null, expiryDate: null } : m
      );
      const uploadedFiles = state.uploadedFiles.filter(
        (f) => f.id !== fileId
      );
      return markDuplicates({ ...state, uploadedFiles, matches });
    }

    case 'MATCH_FILE': {
      const { requirementId, fileId } = action.payload;
      const matches = state.matches.map((m) => {
        // Clear if this file was matched elsewhere
        if (m.fileId === fileId) {
          return { ...m, fileId: null, expiryDate: null };
        }
        // Set new match
        if (m.requirementId === requirementId) {
          return { ...m, fileId, expiryDate: null };
        }
        return m;
      });
      return { ...state, matches };
    }

    case 'UNMATCH': {
      const matches = state.matches.map((m) =>
        m.requirementId === action.payload
          ? { ...m, fileId: null, expiryDate: null }
          : m
      );
      return { ...state, matches };
    }

    case 'SET_EXPIRY': {
      const { requirementId, date } = action.payload;
      const matches = state.matches.map((m) =>
        m.requirementId === requirementId ? { ...m, expiryDate: date } : m
      );
      return { ...state, matches };
    }

    case 'MARK_DUPLICATES':
      return markDuplicates(state);

    default:
      return state;
  }
}

/** Mark files as duplicate if they share the same SHA-256 hash */
function markDuplicates(state: TenderState): TenderState {
  const hashCount = new Map<string, number>();
  for (const f of state.uploadedFiles) {
    hashCount.set(f.hash, (hashCount.get(f.hash) ?? 0) + 1);
  }
  const uploadedFiles = state.uploadedFiles.map((f) => ({
    ...f,
    isDuplicate: (hashCount.get(f.hash) ?? 0) > 1,
  }));
  return { ...state, uploadedFiles };
}

// ── Context ──────────────────────────────────────────────────────────
const TenderContext = createContext<TenderState | null>(null);
const TenderDispatchContext = createContext<Dispatch<TenderAction> | null>(null);

export function TenderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <TenderContext value={state}>
      <TenderDispatchContext value={dispatch}>
        {children}
      </TenderDispatchContext>
    </TenderContext>
  );
}

export function useTender(): TenderState {
  const ctx = useContext(TenderContext);
  if (!ctx) throw new Error('useTender must be used within TenderProvider');
  return ctx;
}

export function useTenderDispatch(): Dispatch<TenderAction> {
  const ctx = useContext(TenderDispatchContext);
  if (!ctx)
    throw new Error('useTenderDispatch must be used within TenderProvider');
  return ctx;
}
