import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from 'react';
import { get, set } from 'idb-keyval';
import type {
  TenderData,
  UploadedFile,
  RequirementMatch,
} from '../types/tender';
import { autoMatchFiles } from '../utils/autoMatch';

export interface TenderState {
  tenderData: TenderData | null;
  uploadedFiles: UploadedFile[];
  matches: RequirementMatch[];
  signatureDataUrl: string | null;
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
  | { type: 'AUTO_MATCH' }
  | { type: 'SET_SIGNATURE'; payload: string | null }
  | { type: 'TOGGLE_SIGNATURE'; payload: string } // Deprecated
  | { type: 'SET_SIGNATURE_PAGES'; payload: { requirementId: string; pages: string } }
  | { type: 'RESTORE_STATE'; payload: TenderState }
  | { type: 'RESET_STATE' };

const initialState: TenderState = {
  tenderData: null,
  uploadedFiles: [],
  matches: [],
  signatureDataUrl: null,
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

    case 'AUTO_MATCH': {
      if (!state.tenderData) return state;
      const suggestedMatches = autoMatchFiles(
        state.tenderData.requirements,
        state.uploadedFiles
      );
      
      const newMatches = state.matches.map((m) => {
        const fileId = suggestedMatches.get(m.requirementId);
        // Only override if not already matched
        if (fileId && !m.fileId) {
          return { ...m, fileId };
        }
        return m;
      });
      
      return { ...state, matches: newMatches };
    }

    case 'SET_SIGNATURE':
      return { ...state, signatureDataUrl: action.payload };

    case 'TOGGLE_SIGNATURE': {
      const matches = state.matches.map((m) =>
        m.requirementId === action.payload
          ? { ...m, applySignature: m.applySignature === undefined ? false : !m.applySignature }
          : m
      );
      return { ...state, matches };
    }

    case 'SET_SIGNATURE_PAGES': {
      const { requirementId, pages } = action.payload;
      const matches = state.matches.map((m) =>
        m.requirementId === requirementId
          ? { ...m, signaturePages: pages }
          : m
      );
      return { ...state, matches };
    }

    case 'RESTORE_STATE':
      return action.payload;

    case 'RESET_STATE':
      return initialState;

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
  const isInitialLoad = useRef(true);

  // Restore state on mount
  useEffect(() => {
    get<TenderState>('tenderState')
      .then((savedState) => {
        if (savedState && savedState.tenderData) {
          dispatch({ type: 'RESTORE_STATE', payload: savedState });
        }
      })
      .catch((e) => console.error('Failed to restore state', e))
      .finally(() => {
        isInitialLoad.current = false;
      });
  }, []);

  // Save state on changes
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    if (state === initialState) {
      import('idb-keyval').then(({ del }) => del('tenderState').catch(e => console.error(e)));
    } else {
      set('tenderState', state).catch((e) =>
        console.error('Failed to save state', e)
      );
    }
  }, [state]);

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
