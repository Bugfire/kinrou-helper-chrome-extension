// Kinrou Helper - UI Functions

async function showNotification(
  message: string,
  type: 'success' | 'error' = 'success'
): Promise<void> {
  // ログに記録（これだけ await）
  await LogManager.logNotification(`[${type}] ${message}`);

  // 通知表示は非同期で実行（待たない）
  displayNotificationElement(message, type);
}

async function displayNotificationElement(
  message: string,
  type: 'success' | 'error'
): Promise<void> {
  const notification = document.createElement('div');
  notification.className = `kinrou-helper-notification ${type === 'error' ? 'error' : ''}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  await delay(2000);
  notification.classList.add('kinrou-helper-notification-hide');
  await delay(300);
  notification.remove();
}

async function insertHelperPanel(): Promise<void> {
  if (document.getElementById('kinrou-helper-panel')) return;

  const state = await StateManager.get();

  const panel = document.createElement('div');
  panel.id = 'kinrou-helper-panel';
  panel.className = 'kinrou-helper-panel';

  if (state.ui.panelMinimized) {
    panel.classList.add('minimized');
  }

  panel.innerHTML = `
    <div class="kinrou-helper-panel-header">
      <span>Kinrou Helper</span>
      <button class="kinrou-helper-minimize-btn" title="最小化">${state.ui.panelMinimized ? '+' : '−'}</button>
    </div>
    <div class="kinrou-helper-panel-body">
      <div id="kinrou-helper-actions-area"></div>

      <div class="kinrou-helper-log-section">
        <div class="kinrou-helper-log-title">ログ</div>
        <div class="kinrou-helper-log-content">
          <div id="kinrou-log-entries" class="kinrou-helper-log-entries"></div>
        </div>
      </div>

      <details class="kinrou-helper-settings-details" ${state.ui.settingsOpen ? 'open' : ''}>
        <summary>設定</summary>
        <div class="kinrou-helper-settings-content">
          <div class="kinrou-helper-form-group">
            <label for="kinrou-houjin-code">法人コード</label>
            <input type="text" id="kinrou-houjin-code" value="${state.settings.houjinCode || ''}" placeholder="法人コードを入力">
          </div>
          <div class="kinrou-helper-form-group">
            <label for="kinrou-user-id">社員コード</label>
            <input type="text" id="kinrou-user-id" value="${state.settings.userId || ''}" placeholder="社員コードを入力">
          </div>
          <div class="kinrou-helper-form-group">
            <label>
              <input type="checkbox" id="kinrou-auto-login" ${state.settings.autoLoginEnabled ? 'checked' : ''}>
              自動ログイン
            </label>
          </div>
          <div class="kinrou-helper-form-group">
            <label>
              <input type="checkbox" id="kinrou-debug-mode" ${state.settings.debugMode ? 'checked' : ''}>
              デバッグモード（打刻しない）
            </label>
          </div>
          <button id="kinrou-reset-settings" class="kinrou-helper-reset-btn">設定を初期化</button>

          <details class="kinrou-helper-json-details">
            <summary>settings</summary>
            <div class="kinrou-helper-json-content">
              <textarea id="kinrou-state-json" class="kinrou-helper-json-textarea" rows="10" readonly></textarea>
            </div>
          </details>
        </div>
      </details>

      <div class="kinrou-helper-workflow-status" id="kinrou-workflow-status" style="display: none;">
        <span class="kinrou-helper-workflow-label">ワークフロー:</span>
        <span class="kinrou-helper-workflow-state" id="kinrou-workflow-state-text">-</span>
        <button id="kinrou-workflow-cancel" class="kinrou-helper-workflow-cancel">キャンセル</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // パネル位置を復元（画面外なら画面内に戻す）
  if (state.ui.panelPosition) {
    let left = state.ui.panelPosition.left;
    let top = state.ui.panelPosition.top;
    const panelWidth = 360;
    const panelHeight = 200;
    const margin = 20;

    if (left < 0) left = margin;
    if (top < 0) top = margin;
    if (left + panelWidth > window.innerWidth) left = window.innerWidth - panelWidth - margin;
    if (top + panelHeight > window.innerHeight) top = window.innerHeight - panelHeight - margin;

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';

    if (left !== state.ui.panelPosition.left || top !== state.ui.panelPosition.top) {
      StateManager.update((s) => (s.ui.panelPosition = { left, top }));
    }
  }

  // イベントリスナー
  panel.querySelector('.kinrou-helper-minimize-btn')!.addEventListener('click', toggleMinimize);
  panel.querySelector('#kinrou-reset-settings')!.addEventListener('click', resetSettings);
  panel.querySelector('#kinrou-workflow-cancel')!.addEventListener('click', cancelWorkflow);

  // 設定フィールドの自動保存
  const settingsInputs = [
    '#kinrou-houjin-code',
    '#kinrou-user-id',
    '#kinrou-auto-login',
    '#kinrou-debug-mode',
  ];
  settingsInputs.forEach((selector) => {
    panel.querySelector(selector)!.addEventListener('change', saveSettings);
  });

  panel.querySelector('.kinrou-helper-settings-details')!.addEventListener('toggle', async (e) => {
    await StateManager.update((s) => (s.ui.settingsOpen = (e.target as HTMLDetailsElement).open));
  });

  panel.querySelector('.kinrou-helper-json-details')!.addEventListener('toggle', async (e) => {
    if ((e.target as HTMLDetailsElement).open) {
      await refreshJsonView();
    }
  });

  makeDraggable(panel);
  await refreshActionsArea();
  await updateWorkflowStatus();
  await refreshLogView();

  window.addEventListener('resize', () => {
    ensurePanelInViewport(panel);
  });
}

function ensurePanelInViewport(panel: HTMLElement): void {
  const panelWidth = 360;
  const panelHeight = 200;
  const margin = 20;

  let left = panel.offsetLeft;
  let top = panel.offsetTop;
  let adjusted = false;

  if (left < 0) {
    left = margin;
    adjusted = true;
  }
  if (top < 0) {
    top = margin;
    adjusted = true;
  }
  if (left + panelWidth > window.innerWidth) {
    left = window.innerWidth - panelWidth - margin;
    adjusted = true;
  }
  if (top + panelHeight > window.innerHeight) {
    top = window.innerHeight - panelHeight - margin;
    adjusted = true;
  }

  if (adjusted) {
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    StateManager.update((s) => (s.ui.panelPosition = { left, top }));
  }
}

async function refreshJsonView(): Promise<void> {
  const textarea = document.getElementById('kinrou-state-json') as HTMLTextAreaElement | null;
  if (!textarea) return;

  const state = await StateManager.get();
  textarea.value = JSON.stringify(state, null, 2);
}

async function refreshLogView(): Promise<void> {
  const container = document.getElementById('kinrou-log-entries');
  if (!container) return;

  const log = await LogManager.get();

  if (log.entries.length === 0) {
    container.innerHTML = '<div class="kinrou-helper-log-empty">ログがありません</div>';
    return;
  }

  const header = log.workflowState
    ? `<div class="kinrou-helper-log-header">ワークフロー「${log.workflowState}」 (${new Date(log.startedAt || 0).toLocaleTimeString()})</div>`
    : '';

  const getIcon = (type: LogEntry['type']): string => {
    switch (type) {
      case 'page_load':
        return '📄';
      case 'workflow_complete':
        return '✅';
      case 'workflow_error':
        return '❌';
      default:
        return '💬';
    }
  };

  const entries = log.entries
    .map((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const icon = getIcon(entry.type);
      let message = entry.message;
      if (entry.type === 'page_load' && entry.url) {
        const path = new URL(entry.url).pathname;
        message = `${entry.title || 'ページ読み込み'}<br><small>${path}</small>`;
      }
      return `<div class="kinrou-helper-log-entry"><span class="kinrou-helper-log-time">${time}</span> ${icon} ${message}</div>`;
    })
    .join('');

  container.innerHTML = header + entries;
}

async function updateWorkflowStatus(): Promise<void> {
  const state = await StateManager.get();
  const workflow = state.workflow;
  const statusEl = document.getElementById('kinrou-workflow-status');
  const stateTextEl = document.getElementById('kinrou-workflow-state-text');

  if (!statusEl || !stateTextEl) return;

  if (workflow.state === 'idle') {
    statusEl.style.display = 'none';
  } else {
    statusEl.style.display = 'flex';
    stateTextEl.textContent = workflow.state;
  }
}

async function cancelWorkflow(): Promise<void> {
  await StateManager.clearWorkflow();
  await updateWorkflowStatus();
  showNotification('ワークフローをキャンセルしました');
}

async function refreshSettingsUI(): Promise<void> {
  const state = await StateManager.get();
  const autoLoginCheckbox = document.getElementById('kinrou-auto-login') as HTMLInputElement | null;
  const debugModeCheckbox = document.getElementById('kinrou-debug-mode') as HTMLInputElement | null;

  if (autoLoginCheckbox) {
    autoLoginCheckbox.checked = state.settings.autoLoginEnabled;
  }
  if (debugModeCheckbox) {
    debugModeCheckbox.checked = state.settings.debugMode;
  }
}

async function toggleMinimize(): Promise<void> {
  const panel = document.getElementById('kinrou-helper-panel');
  if (!panel) return;
  const btn = panel.querySelector('.kinrou-helper-minimize-btn');
  if (!btn) return;
  panel.classList.toggle('minimized');
  const isMinimized = panel.classList.contains('minimized');
  btn.textContent = isMinimized ? '+' : '−';
  await StateManager.update((s) => (s.ui.panelMinimized = isMinimized));
}

function makeDraggable(element: HTMLElement): void {
  const header = element.querySelector('.kinrou-helper-panel-header') as HTMLElement | null;
  if (!header) return;

  let isDragging = false;
  let offsetX: number, offsetY: number;

  header.addEventListener('mousedown', (e: MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    isDragging = true;
    offsetX = e.clientX - element.offsetLeft;
    offsetY = e.clientY - element.offsetTop;
    header.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;
    element.style.left = e.clientX - offsetX + 'px';
    element.style.top = e.clientY - offsetY + 'px';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', async () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'grab';
      await StateManager.update(
        (s) => (s.ui.panelPosition = { left: element.offsetLeft, top: element.offsetTop })
      );
    }
  });
}

async function saveSettings(): Promise<void> {
  const houjinCode = (document.getElementById('kinrou-houjin-code') as HTMLInputElement).value;
  const userId = (document.getElementById('kinrou-user-id') as HTMLInputElement).value;
  const autoLoginEnabled = (document.getElementById('kinrou-auto-login') as HTMLInputElement)
    .checked;
  const debugMode = (document.getElementById('kinrou-debug-mode') as HTMLInputElement).checked;

  await StateManager.update((s) => {
    s.settings.houjinCode = houjinCode;
    s.settings.userId = userId;
    s.settings.autoLoginEnabled = autoLoginEnabled;
    s.settings.debugMode = debugMode;
  });
  await refreshJsonView();
  await refreshActionsArea();
}

async function resetSettings(): Promise<void> {
  if (!window.confirm('すべての設定を初期化しますか？')) {
    return;
  }
  await StateManager.set(DEFAULT_STATE);
  await PasswordManager.clear();
  showNotification('設定を初期化しました。ページを再読み込みします。');
  await delay(1000);
  window.location.reload();
}

async function handlePasswordSubmit(): Promise<void> {
  const passwordInput = document.getElementById('kinrou-password') as HTMLInputElement | null;
  if (!passwordInput) return;

  const password = passwordInput.value.trim();
  if (!password) {
    showNotification('パスワードを入力してください', 'error');
    return;
  }

  await PasswordManager.set(password);
  showNotification('パスワードを設定しました');
  await refreshActionsArea();
}

async function refreshActionsArea(): Promise<void> {
  const actionsArea = document.getElementById('kinrou-helper-actions-area');
  if (!actionsArea) return;

  const state = await StateManager.get();
  const { houjinCode, userId } = state.settings;
  const hasPassword = await PasswordManager.isSet();
  const hasSettings = houjinCode && userId;

  let html = '';

  // 法人コード・社員コードが不足している場合
  if (!hasSettings) {
    const missingItems: string[] = [];
    if (!houjinCode) missingItems.push('法人コード');
    if (!userId) missingItems.push('社員コード');

    html += `
      <div class="kinrou-helper-requirements">
        <p>以下の設定が必要です：</p>
        <ul>
          ${missingItems.map((item) => `<li>${item}</li>`).join('')}
        </ul>
        <p class="kinrou-helper-requirements-hint">下の「設定」を開いて入力してください</p>
      </div>
    `;
  }

  // パスワードが不足している場合
  if (!hasPassword) {
    html += `
      <div class="kinrou-helper-password-form">
        <div class="kinrou-helper-form-group">
          <label for="kinrou-password">パスワード</label>
          <input type="password" id="kinrou-password" placeholder="パスワードを入力">
        </div>
        <button id="kinrou-password-submit" class="kinrou-helper-password-btn">設定</button>
      </div>
    `;
  }

  // すべての設定が揃っている場合
  if (hasSettings && hasPassword) {
    html = `
      <div class="kinrou-helper-actions">
        <button id="kinrou-clock-in-btn" class="kinrou-helper-clock-btn kinrou-helper-clock-in">
          出勤
        </button>
        <button id="kinrou-clock-out-btn" class="kinrou-helper-clock-btn kinrou-helper-clock-out">
          退勤
        </button>
      </div>
    `;
  }

  actionsArea.innerHTML = html;

  // イベントリスナーを設定
  if (hasSettings && hasPassword) {
    actionsArea.querySelector('#kinrou-clock-in-btn')!.addEventListener('click', handleClockIn);
    actionsArea.querySelector('#kinrou-clock-out-btn')!.addEventListener('click', handleClockOut);
  }

  if (!hasPassword) {
    actionsArea
      .querySelector('#kinrou-password-submit')!
      .addEventListener('click', handlePasswordSubmit);
    actionsArea.querySelector('#kinrou-password')!.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') handlePasswordSubmit();
    });
  }

  // 設定が不足している場合は自動ログインを無効化
  if ((!hasSettings || !hasPassword) && state.settings.autoLoginEnabled) {
    await StateManager.update((s) => {
      s.settings.autoLoginEnabled = false;
    });
    await refreshSettingsUI();
  }
}
