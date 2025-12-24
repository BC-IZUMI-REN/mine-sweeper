/**
 * @author bc0109695
 * Cursor用のMCP設定ファイルを生成するスクリプト
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// プロジェクトのパス
const projectPath = __dirname;
const mcpServerPath = join(projectPath, 'dist', 'mcp-server.js');

// Cursorの設定ファイルパス
const cursorSettingsPath = join(
  homedir(),
  'AppData',
  'Roaming',
  'Cursor',
  'User',
  'globalStorage',
  'saoudrizwan.claude-dev',
  'settings',
  'cline_mcp_settings.json'
);

// MCP設定
const mcpConfig = {
  mcpServers: {
    'mine-sweeper': {
      command: 'node',
      args: [mcpServerPath.replace(/\\/g, '\\\\')]
    }
  }
};

try {
  // ディレクトリを作成（存在しない場合）
  mkdirSync(dirname(cursorSettingsPath), { recursive: true });
  
  // 設定ファイルを書き込み
  writeFileSync(cursorSettingsPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
  
  console.log('✅ Cursor MCP設定ファイルを作成しました！');
  console.log(`📁 パス: ${cursorSettingsPath}`);
  console.log('\n設定内容:');
  console.log(JSON.stringify(mcpConfig, null, 2));
  console.log('\n次のステップ:');
  console.log('1. Cursorを再起動してください');
  console.log('2. AIチャットで「start_new_game」ツールを使ってゲームを開始できます');
} catch (error) {
  console.error('❌ エラーが発生しました:', error.message);
  console.log('\n手動で設定する場合:');
  console.log(`パス: ${cursorSettingsPath}`);
  console.log('内容:');
  console.log(JSON.stringify(mcpConfig, null, 2));
}

