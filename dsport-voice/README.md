# D-SPORT AIサポート — デプロイ手順

音声・テキストでD-SPORTのパーツ適合を案内するAIチャットです。

---

## ファイル構成

```
dsport-voice/
├── index.html        ← フロントエンド（チャット画面）
├── api/
│   └── chat.js       ← バックエンド（APIキーを安全に管理）
├── vercel.json        ← Vercel設定
└── README.md
```

---

## デプロイ手順（Vercel）

### 1. Anthropic APIキーを取得する
1. https://console.anthropic.com にアクセス
2. アカウント作成 → 「API Keys」→「Create Key」
3. 表示されたキー（`sk-ant-...`）をコピーして安全な場所に保存

### 2. GitHubにアップロードする
1. https://github.com にログイン（アカウントがなければ作成）
2. 「New repository」→ 名前を入力（例：`dsport-ai`）→「Create repository」
3. ローカルのファイルをすべてアップロード（「uploading an existing file」リンクから）

### 3. Vercelにデプロイする
1. https://vercel.com にアクセス（GitHubアカウントでログイン可）
2. 「Add New Project」→ 先ほどのGitHubリポジトリを選択
3. 「Environment Variables」に以下を追加：
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...（取得したAPIキー）`
4. 「Deploy」ボタンを押す
5. 数分後に `https://あなたのプロジェクト名.vercel.app` のURLが発行される

---

## 動作確認

- PCのChromeまたはEdgeで開く（Safari・Firefoxは音声認識に非対応）
- 🎤ボタンを押して話しかける
- テキスト入力でも使用可能

---

## 将来の電話連携について

このシステムはTwilio等の電話サービスと連携することで、
お客様が電話番号に電話するだけで同じAIと会話できるようになります。
フロントエンドのUIは不要になり、`api/chat.js` のロジックをそのまま流用できます。

---

## 注意事項

- APIキーは絶対に `index.html` や `api/chat.js` に直接書かないでください
- Vercelの環境変数として設定することでセキュリティが保たれます
- APIの利用料金はAnthropicの従量課金（1回の会話あたり約0.1〜0.5円程度）
