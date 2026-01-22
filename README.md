# Kinrou Helper

「勤労の獅子」の操作を補助する Chrome 拡張機能です。

## 機能

- **自動ログイン**: 法人コード・社員コード・パスワードを設定すると、ログインページで自動的にログインします
- **ワンクリック打刻**: パネルの「出勤」「退勤」ボタンで打刻できます
- **デバッグモード**: 実際に打刻せずに動作確認ができます

## インストール

### リリースから（推奨）

1. [Releases](https://github.com/Bugfire/kinrou-helper-chrome-extension/releases) から最新の `kinrou-helper-chrome-extension.zip` をダウンロード
2. zip を展開
3. Chrome で `chrome://extensions/` を開く
4. 「デベロッパーモード」を有効化
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 展開したフォルダを選択

### ソースから

```bash
git clone https://github.com/Bugfire/kinrou-helper-chrome-extension.git
cd kinrou-helper-chrome-extension
make setup
make dist
```

`dist/` フォルダを Chrome に読み込んでください。

## 使い方

1. 勤労の獅子のページ (`https://kinrouap1.hr44.jp/kinrou/kojin/*`) にアクセス
2. 画面右下に「Kinrou Helper」パネルが表示されます
3. 「設定」を開いて法人コード・社員コードを入力
4. パスワードを入力して「設定」をクリック
5. 「自動ログイン」をチェック
6. 「出勤」または「退勤」ボタンで打刻

## セキュリティ

- パスワードは `chrome.storage.session` に保存され、ブラウザを閉じると消去されます
- 法人コード・社員コードは `chrome.storage.local` に永続化されます
- ワークフロー状態・ログはセッション中のみ保持されます

## 開発

```bash
# 依存関係のインストール
make setup

# ビルド（dist/ に出力）
make dist

# リリース用 zip 作成
make build

# クリーンアップ
make clean
```
