// Kinrou Helper - Login Functions

const LOGIN_ATTEMPT_THRESHOLD_MS = 10 * 1000; // 10秒

async function tryAutoLogin(): Promise<void> {
  const state = await StateManager.get();
  const { houjinCode, userId, autoLoginEnabled } = state.settings;
  const password = await PasswordManager.get();
  const workflow = state.workflow;

  // 自動ログインが無効な場合
  if (!autoLoginEnabled) {
    if (workflow.state !== 'idle') {
      await showNotification('自動ログインが無効のためワークフローを実行できません', 'error');
      await StateManager.clearWorkflow(true);
      await updateWorkflowStatus();
    }
    return;
  }

  // ログイン情報が不足している場合
  if (!houjinCode || !userId) {
    if (workflow.state !== 'idle') {
      await showNotification('ログイン情報が設定されていません', 'error');
      await StateManager.clearWorkflow(true);
      await updateWorkflowStatus();
    }
    return;
  }

  // パスワードが設定されていない場合
  if (!password) {
    if (workflow.state !== 'idle') {
      await showNotification(
        'パスワードが設定されていません。拡張機能のポップアップから入力してください',
        'error'
      );
      await StateManager.clearWorkflow(true);
      await updateWorkflowStatus();
    }
    return;
  }

  // 最近ログイン試行済みの場合（ログイン失敗でリダイレクトされた）
  const lastAttempt = state.lastLoginAttempt;
  if (lastAttempt && Date.now() - lastAttempt < LOGIN_ATTEMPT_THRESHOLD_MS) {
    await showNotification('ログインに失敗しました。自動ログインを無効にします', 'error');
    await StateManager.update((s) => {
      s.settings.autoLoginEnabled = false;
      s.lastLoginAttempt = null;
    });
    await refreshSettingsUI();
    if (workflow.state !== 'idle') {
      await StateManager.clearWorkflow(true);
      await updateWorkflowStatus();
    }
    return;
  }

  // ログイン試行時刻を記録
  await StateManager.update((s) => {
    s.lastLoginAttempt = Date.now();
  });

  const houjinInput = document.querySelector('input[name="houjinCode"]') as HTMLInputElement | null;
  const userIdInput = document.querySelector('input[name="userId"]') as HTMLInputElement | null;
  const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement | null;
  const submitButton = document.querySelector('input[name="bt"]') as HTMLInputElement | null;

  if (!houjinInput || !userIdInput || !passwordInput) return;

  houjinInput.value = houjinCode;
  userIdInput.value = userId;
  passwordInput.value = password;
  houjinInput.dispatchEvent(new Event('input', { bubbles: true }));
  userIdInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

  await delay(500);
  if (submitButton) {
    submitButton.click();
  } else {
    const form = houjinInput.closest('form');
    if (form) form.submit();
  }
}
