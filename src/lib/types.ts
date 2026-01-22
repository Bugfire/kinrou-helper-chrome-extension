// Kinrou Helper - Type Definitions

interface UIState {
  panelPosition: { left: number; top: number } | null;
  panelMinimized: boolean;
  settingsOpen: boolean;
}

interface Settings {
  houjinCode: string;
  userId: string;
  autoLoginEnabled: boolean;
  debugMode: boolean;
}

interface WorkflowData {
  startedAt?: number;
}

interface Workflow {
  state: 'idle' | '出勤' | '退勤';
  data: WorkflowData;
  updatedAt: number | null;
}

interface LogEntry {
  timestamp: number;
  type: 'notification' | 'page_load' | 'workflow_complete' | 'workflow_error';
  message: string;
  url?: string;
  title?: string;
}

interface WorkflowLog {
  entries: LogEntry[];
  workflowState: Workflow['state'] | null;
  startedAt: number | null;
}

// localStorage に保存（永続化）
interface PersistentState {
  ui: UIState;
  settings: Settings;
}

// sessionStorage に保存（セッションのみ）
interface SessionState {
  workflow: Workflow;
  lastLoginAttempt: number | null;
}

// 結合した状態
interface AppState extends PersistentState, SessionState {}

// Chrome Extension API types
declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys: string | string[]): Promise<{ [key: string]: unknown }>;
      set(items: { [key: string]: unknown }): Promise<void>;
    }
    interface SessionStorageArea extends StorageArea {
      setAccessLevel(options: {
        accessLevel: 'TRUSTED_CONTEXTS' | 'TRUSTED_AND_UNTRUSTED_CONTEXTS';
      }): Promise<void>;
    }
    const local: StorageArea;
    const session: SessionStorageArea;
  }
  namespace runtime {
    const id: string | undefined;
    interface InstalledDetails {
      reason: string;
    }
    const onInstalled: {
      addListener(callback: (details: InstalledDetails) => void): void;
    };
  }
  namespace tabs {
    function create(options: { url: string }): void;
  }
}
