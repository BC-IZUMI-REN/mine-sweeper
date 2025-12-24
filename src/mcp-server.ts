/**
 * @author bc0109695
 * MCPサーバー - マインスイーパーをAIがプレイできるようにする
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { GameState, Position } from "./types.js";
import {
  createNewGame,
  createBoard,
  revealCell,
  toggleFlag,
} from "./gameLogic.js";
import {
  connectToWebSocketServer,
  broadcastGameState,
  broadcastAction,
} from "./gameStateManager.js";

// ゲーム状態を保存（簡易的な実装、実際の運用では永続化が必要）
let currentGame: GameState | null = null;

const server = new Server(
  {
    name: "mine-sweeper-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧を取得
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: "get_rules",
      description: "マインスイーパーのルールを取得します",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_board_state",
      description:
        "現在のゲームボードの状態を取得します。各セルの状態（hidden/revealed/flagged）、周囲の地雷数、地雷の有無を確認できます。",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "place_flag",
      description: "指定したセルに予想フラグ（地雷があると予想）を置きます",
      inputSchema: {
        type: "object",
        properties: {
          row: {
            type: "number",
            description: "行番号（0から始まる）",
          },
          col: {
            type: "number",
            description: "列番号（0から始まる）",
          },
        },
        required: ["row", "col"],
      },
    },
    {
      name: "click_cell",
      description: "指定したセルを開きます（押下します）",
      inputSchema: {
        type: "object",
        properties: {
          row: {
            type: "number",
            description: "行番号（0から始まる）",
          },
          col: {
            type: "number",
            description: "列番号（0から始まる）",
          },
        },
        required: ["row", "col"],
      },
    },
    {
      name: "start_new_game",
      description: "新しいゲームを開始します",
      inputSchema: {
        type: "object",
        properties: {
          rows: {
            type: "number",
            description: "行数（デフォルト: 9）",
            default: 9,
          },
          cols: {
            type: "number",
            description: "列数（デフォルト: 9）",
            default: 9,
          },
          mines: {
            type: "number",
            description: "地雷の数（デフォルト: 10）",
            default: 10,
          },
        },
      },
    },
  ];

  return { tools };
});

// ツールの実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_rules": {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  rules: [
                    "マインスイーパーは、地雷を避けながらすべての安全なセルを開くゲームです",
                    "左クリック（click_cell）でセルを開きます",
                    "右クリック（place_flag）で地雷の予想フラグを置きます",
                    "開いたセルに表示される数字は、そのセルの周囲8方向にある地雷の数を示します",
                    "すべての安全なセルを開くと勝利です",
                    "地雷を踏むとゲームオーバーです",
                    "最初のクリックでは地雷を踏むことはありません",
                    "最初のクリック後にやるべきことは、「確実に地雷」といえるセルにフラグを置くことです",
                    "確実にフラグが置けるセルがなくなったら、クリックして開けるセルを決めます",
                    "セルの数字と、セルの周囲8方向に方向にある既に立ててあるフラグの数が一致すれば、残りの隣接未開封セルはすべて安全です。開いていきましょう",
                    "開封可能なセルがなくなったら、再度「確実に地雷」といえるセルを探してフラグを行います",
                    "分からないときは推測よりも、矛盾が出るかを試す「仮定法（仮にここが地雷なら）」を使うことを考えてください",
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_board_state": {
        if (!currentGame) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error:
                      "ゲームが開始されていません。start_new_gameを呼び出してゲームを開始してください。",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const boardState = currentGame.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => ({
            position: { row: rowIndex, col: colIndex },
            state: cell.state,
            adjacentMines:
              cell.state === "revealed" ? cell.adjacentMines : null,
            isMine: cell.state === "revealed" ? cell.isMine : null,
          }))
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  rows: currentGame.rows,
                  cols: currentGame.cols,
                  mines: currentGame.mines,
                  flagsPlaced: currentGame.flagsPlaced,
                  status: currentGame.status,
                  board: boardState,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "place_flag": {
        if (!currentGame) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error:
                      "ゲームが開始されていません。start_new_gameを呼び出してゲームを開始してください。",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const { row, col } = args as { row: number; col: number };

        if (
          row < 0 ||
          row >= currentGame.rows ||
          col < 0 ||
          col >= currentGame.cols
        ) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `無効な位置です。行は0-${
                      currentGame.rows - 1
                    }、列は0-${currentGame.cols - 1}の範囲で指定してください。`,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (currentGame.status !== "playing") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `ゲームは既に終了しています。状態: ${currentGame.status}`,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        currentGame = toggleFlag(currentGame, row, col);
        const cell = currentGame.board[row][col];

        // WebSocketでブロードキャスト
        broadcastGameState(currentGame);
        broadcastAction("place_flag", { row, col, state: cell.state });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `セル(${row}, ${col})に${
                    cell.state === "flagged"
                      ? "フラグを設置しました"
                      : "フラグを解除しました"
                  }`,
                  flagsPlaced: currentGame.flagsPlaced,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "click_cell": {
        if (!currentGame) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error:
                      "ゲームが開始されていません。start_new_gameを呼び出してゲームを開始してください。",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const { row, col } = args as { row: number; col: number };

        if (
          row < 0 ||
          row >= currentGame.rows ||
          col < 0 ||
          col >= currentGame.cols
        ) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `無効な位置です。行は0-${
                      currentGame.rows - 1
                    }、列は0-${currentGame.cols - 1}の範囲で指定してください。`,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (currentGame.status !== "playing") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `ゲームは既に終了しています。状態: ${currentGame.status}`,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const cell = currentGame.board[row][col];
        if (cell.state === "flagged") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error:
                      "フラグが設置されているセルは開けません。まずフラグを解除してください。",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (cell.state === "revealed") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    message: "このセルは既に開いています。",
                    adjacentMines: cell.adjacentMines,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // 最初のクリックの場合は、地雷を配置してから開く
        const isFirstClick = currentGame.board.every((row) =>
          row.every((cell) => cell.state === "hidden")
        );

        if (isFirstClick) {
          const board = createBoard(
            currentGame.rows,
            currentGame.cols,
            currentGame.mines,
            { row, col }
          );
          currentGame = {
            ...currentGame,
            board,
          };
        }

        currentGame = revealCell(currentGame, row, col);
        const clickedCell = currentGame.board[row][col];

        // WebSocketでブロードキャスト
        broadcastGameState(currentGame);
        broadcastAction("click_cell", { row, col, result: currentGame.status });

        if (currentGame.status === "lost") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    message: "ゲームオーバー！地雷を踏んでしまいました。",
                    status: currentGame.status,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        if (currentGame.status === "won") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: "勝利！すべての安全なセルを開きました！",
                    status: currentGame.status,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `セル(${row}, ${col})を開きました`,
                  adjacentMines: clickedCell.adjacentMines,
                  isMine: clickedCell.isMine,
                  status: currentGame.status,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "start_new_game": {
        const rows = (args as { rows?: number })?.rows ?? 9;
        const cols = (args as { cols?: number })?.cols ?? 9;
        const mines = (args as { mines?: number })?.mines ?? 10;

        if (rows < 1 || cols < 1 || mines < 1) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "行数、列数、地雷数は1以上である必要があります。",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (mines >= rows * cols) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error:
                      "地雷数が多すぎます。地雷数は行数×列数より少なくする必要があります。",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        currentGame = createNewGame(rows, cols, mines);

        // WebSocketでブロードキャスト
        broadcastGameState(currentGame);
        broadcastAction("start_new_game", { rows, cols, mines });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `新しいゲームを開始しました（${rows}行×${cols}列、地雷${mines}個）`,
                  rows,
                  cols,
                  mines,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: `未知のツール: ${name}`,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "不明なエラーが発生しました",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// サーバーを起動
async function main() {
  // WebSocketサーバーに接続
  connectToWebSocketServer();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("マインスイーパーMCPサーバーが起動しました");
}

main().catch(console.error);
