# マインスイーパー

マインスイーパーゲーム（人間プレイ可能 + AIプレイ可能なMCPサーバー）

## 作者
bc0109695

## 機能

- 人間がプレイできるWeb版マインスイーパー
- AIがプレイできるMCPサーバー（今後実装予定）

## セットアップ

```bash
npm install
```

## 使い方

### 人間がプレイする場合

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてゲームをプレイできます。

### AIのプレイを見る場合

3つのターミナルで以下を順番に起動します：

**ターミナル1: WebSocketサーバー**
```bash
npm run ws-server
```

**ターミナル2: Web UI**
```bash
npm run dev
```

**ターミナル3: Cursorの設定（初回のみ）**
```bash
npm run setup-cursor
```

その後、Cursorを再起動し、AIチャットで「マインスイーパーで遊びたいです」と話しかけてください。
AIがプレイする様子がブラウザ（http://localhost:3000）でリアルタイムに表示されます！

## ビルド

```bash
npm run build
```

## ゲームのルール

1. 左クリックでセルを開きます
2. 右クリックでフラグ（地雷の予想）を置きます
3. すべての安全なセルを開くと勝利です
4. 地雷を踏むとゲームオーバーです

## MCPサーバー

AIがプレイできるようにするためのMCPサーバーを実装しました。
以下のツールを提供します：

### 利用可能なツール

1. **get_rules** - マインスイーパーのルールを取得
2. **get_board_state** - 現在のゲームボードの状態を取得
3. **place_flag** - 指定したセルに予想フラグを置く
4. **click_cell** - 指定したセルを開く（押下する）
5. **start_new_game** - 新しいゲームを開始

### MCPサーバーの起動

```bash
npm run mcp
```

### Cursorへの設定（自動）

以下のコマンドを実行すると、自動的にCursorの設定ファイルが作成されます：

```bash
npm run setup-cursor
```

その後、**Cursorを再起動**してください。

### Cursorへの設定（手動）

自動設定がうまくいかない場合は、以下のファイルを手動で編集してください：

**パス:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

**内容:**
```json
{
  "mcpServers": {
    "mine-sweeper": {
      "command": "node",
      "args": ["<プロジェクトのパス>\\dist\\mcp-server.js"]
    }
  }
}
```

**注意:** `<プロジェクトのパス>` を実際のプロジェクトのパスに置き換えてください。例: `C:\\Users\\YourName\\projects\\mine-sweeper`

### AIでプレイする方法

Cursorを再起動後、AIチャットで以下のように話しかけてください：

```
マインスイーパーで遊びたいです。新しいゲームを開始してください。
```

AIが以下のツールを使ってプレイします：
- `start_new_game` - ゲーム開始
- `get_board_state` - ボード状態確認
- `click_cell` - セルを開く
- `place_flag` - フラグを置く

