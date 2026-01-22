// Kinrou Helper - Background Service Worker

// コンテンツスクリプトから chrome.storage.session にアクセスできるようにする
chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

// 拡張機能インストール時
chrome.runtime.onInstalled.addListener(() => {
  console.log('Kinrou Helper installed');
});
