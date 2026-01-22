// Kinrou Helper - State Manager

function isExtensionContextValid(): boolean {
  try {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  } catch {
    return false;
  }
}

class StateManager {
  static _cache: AppState | null = null;

  static async get(): Promise<AppState> {
    if (this._cache) return this._cache;
    if (!isExtensionContextValid()) {
      return this._mergeWithDefault({}, {});
    }
    try {
      const [persistentResult, sessionResult] = await Promise.all([
        chrome.storage.local.get(SETTINGS_KEY),
        chrome.storage.session.get(SESSION_STATE_KEY),
      ]);
      const persistent = (persistentResult[SETTINGS_KEY] as Partial<PersistentState>) || {};
      const session = (sessionResult[SESSION_STATE_KEY] as Partial<SessionState>) || {};
      this._cache = this._mergeWithDefault(persistent, session);
      return this._cache;
    } catch {
      return this._mergeWithDefault({}, {});
    }
  }

  static async set(state: AppState): Promise<void> {
    this._cache = state;
    if (!isExtensionContextValid()) {
      return;
    }
    try {
      const persistent: PersistentState = {
        ui: state.ui,
        settings: state.settings,
      };
      const session: SessionState = {
        workflow: state.workflow,
        lastLoginAttempt: state.lastLoginAttempt,
      };
      await Promise.all([
        chrome.storage.local.set({ [SETTINGS_KEY]: persistent }),
        chrome.storage.session.set({ [SESSION_STATE_KEY]: session }),
      ]);
    } catch {
      // Extension context invalidated
    }
  }

  static async update(updater: (state: AppState) => void): Promise<AppState> {
    const state = await this.get();
    updater(state);
    await this.set(state);
    return state;
  }

  static _mergeWithDefault(
    persistent: Partial<PersistentState>,
    session: Partial<SessionState>
  ): AppState {
    return {
      ui: { ...DEFAULT_PERSISTENT_STATE.ui, ...persistent.ui },
      settings: { ...DEFAULT_PERSISTENT_STATE.settings, ...persistent.settings },
      workflow: { ...DEFAULT_SESSION_STATE.workflow, ...session.workflow },
      lastLoginAttempt: session.lastLoginAttempt ?? DEFAULT_SESSION_STATE.lastLoginAttempt,
    };
  }

  static async setWorkflow(
    workflowState: Workflow['state'],
    data: WorkflowData = {}
  ): Promise<AppState> {
    return await this.update((s) => {
      s.workflow.state = workflowState;
      s.workflow.data = data;
      s.workflow.updatedAt = Date.now();
    });
  }

  static async clearWorkflow(isError: boolean = false): Promise<AppState> {
    if (isError) {
      await LogManager.addEntry('workflow_error', 'ワークフローが正常に完了できませんでした');
    } else {
      await LogManager.addEntry('workflow_complete', 'ワークフローが正常に完了しました');
    }
    return await this.setWorkflow('idle', {});
  }

  static clearCache(): void {
    this._cache = null;
  }
}
