// Kinrou Helper - Constants

const LOGIN_PAGE_URLS: string[] = [
  'https://kinrouap1.hr44.jp/kinrou/kojin/login/',
  'https://kinrouap1.hr44.jp/kinrou/kojin/login/login',
  'https://kinrouap1.hr44.jp/kinrou/kojin/',
];
const CLOCK_PAGE_URL = 'https://kinrouap1.hr44.jp/kinrou/kojin/kintaiDakoku/';
const SETTINGS_KEY = 'kinrouHelperSettings'; // localStorage: ui, settings
const SESSION_STATE_KEY = 'kinrouHelperSessionState'; // sessionStorage: workflow, lastLoginAttempt
const LOG_KEY = 'kinrouHelperLog';
const PASSWORD_KEY = 'kinrouHelperPassword';

const DEFAULT_LOG: WorkflowLog = {
  entries: [],
  workflowState: null,
  startedAt: null,
};
const PAGE_LOAD_TIME = Date.now();
const RELOAD_THRESHOLD_MS = 60 * 1000; // 1分
const WORKFLOW_TIMEOUT_MS = 60 * 1000; // 1分

const DEFAULT_PERSISTENT_STATE: PersistentState = {
  ui: {
    panelPosition: null,
    panelMinimized: false,
    settingsOpen: false,
  },
  settings: {
    houjinCode: '',
    userId: '',
    autoLoginEnabled: true,
    debugMode: false,
  },
};

const DEFAULT_SESSION_STATE: SessionState = {
  workflow: {
    state: 'idle',
    data: {},
    updatedAt: null,
  },
  lastLoginAttempt: null,
};

const DEFAULT_STATE: AppState = {
  ...DEFAULT_PERSISTENT_STATE,
  ...DEFAULT_SESSION_STATE,
};
