var SPREADSHEET_ID = '1zuJByrnAkA_T4hbqeyPYhgk_Duc0-hoJi2PW9M5JpjM';
var SHEET_NAME = 'Custom Trip Enquiries';

var COLUMNS = [
  'submitted_at', 'lead_id', 'partial', 'name', 'phone', 'email', 'trip_type',
  'travel_window', 'travelling_with', 'occasion', 'trip_scope', 'destination_note',
  'contact_preference', 'call_time_preference', 'message', 'intent_score',
  'value_score', 'lead_tier', 'page', 'referrer', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'utm_term', 'fbclid'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    var book = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
    var row = COLUMNS.map(function (key) { return data[key] == null ? '' : data[key]; });
    var leadId = String(data.lead_id || '').trim();
    var existingRow = 0;

    if (leadId && sheet.getLastRow() > 1) {
      var leadIdColumn = COLUMNS.indexOf('lead_id') + 1;
      var match = sheet.getRange(2, leadIdColumn, sheet.getLastRow() - 1, 1)
        .createTextFinder(leadId)
        .matchEntireCell(true)
        .findNext();
      if (match) existingRow = match.getRow();
    }

    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, COLUMNS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
