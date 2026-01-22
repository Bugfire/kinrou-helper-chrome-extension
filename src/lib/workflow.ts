// Kinrou Helper - Workflow Functions

async function continueWorkflow(): Promise<void> {
  const state = await StateManager.get();
  const workflow = state.workflow;

  // ログインページ以外にいる場合、ログイン試行時刻をクリア
  if (!isOnLoginPage() && state.lastLoginAttempt) {
    await StateManager.update((s) => {
      s.lastLoginAttempt = null;
    });
  }

  if (workflow.state === 'idle') return;

  // ワークフローが1分以上経過していたら削除
  const startedAt = workflow.data.startedAt;
  if (startedAt && Date.now() - startedAt > WORKFLOW_TIMEOUT_MS) {
    console.log('Workflow timed out:', workflow);
    await showNotification('ワークフローがタイムアウトしました', 'error');
    await StateManager.clearWorkflow(true);
    await updateWorkflowStatus();
    return;
  }

  console.log('Continuing workflow:', workflow);
  await evaluateWorkflow(workflow);
}

async function evaluateWorkflow(workflow: Workflow): Promise<void> {
  const { state } = workflow;

  // タイムアウトエラーの場合はログインページへ
  if (isSessionTimeout()) {
    await showNotification('セッションタイムアウト。再ログインします');
    window.location.href = LOGIN_PAGE_URLS[0];
    return;
  }

  // 500エラーの場合はログインページへ
  if (isServerError()) {
    await showNotification('サーバーエラー。再ログインします');
    window.location.href = LOGIN_PAGE_URLS[0];
    return;
  }

  // ログインページにいる場合は何もしない（tryAutoLoginに任せる）
  if (isOnLoginPage()) {
    return;
  }

  // 打刻ページでなければ遷移
  if (!isOnClockPage()) {
    await showNotification('打刻ページへ移動します');
    window.location.href = CLOCK_PAGE_URL;
    return;
  }

  // 打刻ページで1分以上経過していたらリロード
  if (isPageStale()) {
    await showNotification('ページをリロードして打刻します');
    window.location.reload();
    return;
  }

  // 打刻ページでアクションを実行
  switch (state) {
    case '出勤':
      await executeClockAction('出勤', '出　勤');
      break;
    case '退勤':
      await executeClockAction('退勤', '退　勤');
      break;
    default:
      console.log('Unknown workflow state:', state);
  }
}

async function executeClockAction(actionName: string, buttonValue: string): Promise<void> {
  const state = await StateManager.get();
  const debugMode = state.settings.debugMode;

  // Step 1: main_button を押して出勤/退勤モードにする
  const mainButton = document.querySelector(
    `input[name="main_button"][value="${buttonValue}"]`
  ) as HTMLInputElement | null;
  if (!mainButton) {
    await showNotification(`${actionName}ボタンが見つかりません`, 'error');
    return;
  }

  await showNotification(`${actionName}モードに切り替えます`);
  await delay(500);
  mainButton.click();

  // Step 2: dakoku ボタンを押す（デバッグモードではスキップ）
  await delay(500);
  const dakokuButton = document.querySelector('input[name="dakoku"]') as HTMLInputElement | null;
  if (!dakokuButton) {
    await showNotification('打刻ボタンが見つかりません', 'error');
    return;
  }

  if (debugMode) {
    await showNotification(`[デバッグ] ${actionName}打刻をスキップしました`);
    console.log('[Kinrou Helper Debug]', {
      actionName,
      mainButton,
      dakokuButton,
      url: window.location.href,
    });
  } else {
    await showNotification(`${actionName}打刻を実行します`);
    dakokuButton.click();
  }

  // 打刻完了後にワークフローをクリア（ログはそのまま）
  await StateManager.clearWorkflow();
  await updateWorkflowStatus();
}

async function handleClockIn(): Promise<void> {
  await startClockWorkflow('出勤');
}

async function handleClockOut(): Promise<void> {
  await startClockWorkflow('退勤');
}

async function startClockWorkflow(workflowState: Workflow['state']): Promise<void> {
  // 新しいワークフロー開始時にログをクリア
  await LogManager.startNewWorkflow(workflowState);

  await StateManager.setWorkflow(workflowState, {
    startedAt: Date.now(),
  });
  await updateWorkflowStatus();

  if (!isLoggedIn()) {
    await showNotification(`ワークフロー「${workflowState}」のためログインします`);
    window.location.href = LOGIN_PAGE_URLS[0];
    return;
  }

  const state = await StateManager.get();
  await evaluateWorkflow(state.workflow);
}
