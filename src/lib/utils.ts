// Kinrou Helper - Utility Functions

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSessionTimeout(): boolean {
  return document.title.includes('タイムアウトエラー');
}

function isServerError(): boolean {
  return document.title.includes('500エラー') || document.title.includes('500 Error');
}

function isOnClockPage(): boolean {
  return window.location.href.startsWith(CLOCK_PAGE_URL);
}

function isOnLoginPage(): boolean {
  const url = window.location.href;
  return LOGIN_PAGE_URLS.some((loginUrl) => url === loginUrl || url.startsWith(loginUrl + '?'));
}

function isLoggedIn(): boolean {
  if (isOnLoginPage()) {
    return false;
  }
  if (isSessionTimeout()) {
    return false;
  }
  return true;
}

function isPageStale(): boolean {
  return Date.now() - PAGE_LOAD_TIME > RELOAD_THRESHOLD_MS;
}
