/**
 * 採用データ管理 SpreadSheet API
 * 部署: /exec
 * Method: POST
 * Content-Type: application/json
 */

// Web API エントリーポイント
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    // バリデーション
    if (!data.email || !data.name) {
      return createResponse(400, 'error', '必須項目が不足しています');
    }

    // 重複チェック
    const duplicateCheck = checkDuplicate(sheet, data.email);
    if (duplicateCheck.isDuplicate) {
      return createResponse(409, 'duplicate', '既に同じメールアドレスの応募があります', {
        existingRow: duplicateCheck.row
      });
    }

    // データ追加
    const rowData = [
      new Date(),                    // A: タイムスタンプ
      data.name,                     // B: 名前
      data.email,                    // C: メールアドレス
      data.rank,                     // D: ランク
      data.summary,                  // E: 要約
      data.skills,                   // F: スキルセット
      '未対応',                       // G: ステータス
      '',                            // H: 対応者
      '',                            // I: 備考
      generateUniqueId()             // J: 応募ID
    ];

    sheet.appendRow(rowData);
    const lastRow = sheet.getLastRow();

    // 行の色付け
    applyRowColor(sheet, lastRow, data.rank);

    // ログ記録
    logAction('INSERT', data.email, `Row ${lastRow}`);

    return createResponse(200, 'success', 'データを追加しました', {
      row: lastRow,
      id: rowData[9]
    });

  } catch (error) {
    logAction('ERROR', 'system', error.toString());
    return createResponse(500, 'error', error.toString());
  }
}

// シート取得または作成
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('応募データ');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('応募データ');
    // ヘッダー行作成
    sheet.appendRow([
      'タイムスタンプ', '名前', 'メールアドレス', 'ランク',
      '要約', 'スキルセット', 'ステータス', '対応者', '備考', '応募ID'
    ]);

    // ヘッダー行の書式設定
    const headerRange = sheet.getRange(1, 1, 1, 10);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');

    // 列幅調整
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 80);
    sheet.setColumnWidth(5, 300);
    sheet.setColumnWidth(6, 250);
    sheet.setColumnWidth(7, 100);
    sheet.setColumnWidth(10, 150);
  }

  return sheet;
}

// 重複チェック
function checkDuplicate(sheet, email) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email) {
      return { isDuplicate: true, row: i + 1 };
    }
  }
  return { isDuplicate: false };
}

// ランクに応じた色付け
function applyRowColor(sheet, row, rank) {
  const colorMap = {
    'S': '#ffebee', // 赤系 - 最優先
    'A': '#fff3e0', // 橙系 - 高優先
    'B': '#e8f5e9', // 緑系 - 中優先
    'C': '#f5f5f5'  // 灰系 - 低優先/保留
  };

  const color = colorMap[rank] || '#ffffff';
  sheet.getRange(row, 1, 1, 10).setBackground(color);
}

// ユニークID生成
function generateUniqueId() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `APP-${timestamp}-${random}`;
}

// ログ記録
function logAction(action, target, detail) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = spreadsheet.getSheetByName('システムログ');

  if (!logSheet) {
    logSheet = spreadsheet.insertSheet('システムログ');
    logSheet.appendRow(['タイムスタンプ', 'アクション', '対象', '詳細']);
  }

  logSheet.appendRow([new Date(), action, target, detail]);
}

// レスポンス生成
function createResponse(statusCode, status, message, data = {}) {
  const response = {
    status: status,
    message: message,
    timestamp: new Date().toISOString(),
    ...data
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET メソッド（ヘルスチェック用）
function doGet(e) {
  return createResponse(200, 'success', 'GAS Web API is running');
}
