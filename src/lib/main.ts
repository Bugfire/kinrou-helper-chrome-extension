// Kinrou Helper - Main Entry Point

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init(): Promise<void> {
  // ページ読み込みをログ
  await LogManager.logPageLoad();

  await insertHelperPanel();

  if (isOnLoginPage()) {
    // ログインページではログイン処理のみ（ページ遷移後にワークフロー継続）
    await tryAutoLogin();
  } else {
    await continueWorkflow();
  }
}
