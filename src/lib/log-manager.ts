// Kinrou Helper - Log Manager

class LogManager {
  static async get(): Promise<WorkflowLog> {
    if (!isExtensionContextValid()) {
      return { ...DEFAULT_LOG };
    }
    try {
      const result = await chrome.storage.session.get(LOG_KEY);
      return (result[LOG_KEY] as WorkflowLog) || { ...DEFAULT_LOG };
    } catch {
      return { ...DEFAULT_LOG };
    }
  }

  static async set(log: WorkflowLog): Promise<void> {
    if (!isExtensionContextValid()) {
      return;
    }
    try {
      await chrome.storage.session.set({ [LOG_KEY]: log });
    } catch {
      // Extension context invalidated
    }
  }

  static async clear(): Promise<void> {
    await this.set({ ...DEFAULT_LOG });
  }

  static async startNewWorkflow(workflowState: Workflow['state']): Promise<void> {
    await this.set({
      entries: [],
      workflowState,
      startedAt: Date.now(),
    });

    // ログUIを即座に更新
    if (typeof refreshLogView === 'function') {
      refreshLogView();
    }
  }

  static async addEntry(
    type: LogEntry['type'],
    message: string,
    url?: string,
    title?: string
  ): Promise<void> {
    const log = await this.get();
    log.entries.push({
      timestamp: Date.now(),
      type,
      message,
      url,
      title,
    });
    await this.set(log);

    // ログUIを即座に更新
    if (typeof refreshLogView === 'function') {
      await refreshLogView();
    }
  }

  static async logNotification(message: string): Promise<void> {
    await this.addEntry('notification', message);
  }

  static async logPageLoad(): Promise<void> {
    // ワークフロー実行中のみログを記録
    const state = await StateManager.get();
    if (state.workflow.state === 'idle') return;

    await this.addEntry('page_load', 'ページ読み込み', window.location.href, document.title);
  }
}
