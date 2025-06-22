function doPost(e) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const tz   = ss.getSpreadsheetTimeZone();
  const now  = new Date();
  const day  = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const time = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss');

  const gmail    = (Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const roll     = (e.parameter.roll     || '').trim();
  const location = (e.parameter.location || '').trim();
  const address  = (e.parameter.address  || '').trim();

  if (!gmail || !roll) {
    return _json({status: 'error', message: 'Missing Gmail or Roll number'});
  }

  // 1️⃣ Today's Sheet
  const daySheet = ss.getSheetByName(day) || ss.insertSheet(day);
  if (daySheet.getLastRow() === 0) {
    daySheet.appendRow(['Timestamp', 'Gmail', 'Roll', 'Location', 'Address']);
  }

  // 2️⃣ Check for existing row in today's sheet
  const dayData = daySheet.getRange(2, 2, daySheet.getLastRow() - 1, 2).getValues(); // B & C
  let dayRow = -1;
  dayData.forEach((row, i) => {
    if (row[0].toLowerCase() === gmail || row[1] === roll) {
      dayRow = i + 2;
    }
  });

  if (dayRow > -1) {
    // ✅ Update existing row
    daySheet.getRange(dayRow, 1, 1, 5).setValues([[time, gmail, roll, location, address]]);
  } else {
    // ➕ Add new row
    daySheet.appendRow([time, gmail, roll, location, address]);
  }

  // 3️⃣ Attendance Master Sheet
  const master = ss.getSheetByName('Attendance Master') || ss.insertSheet('Attendance Master');
  if (master.getLastRow() === 0) {
    master.appendRow(['Timestamp', 'Gmail', 'Roll', 'Location', 'Address']);
  }

  const masterData = master.getDataRange().getValues();
  let masterRow = -1;
  masterData.forEach((row, i) => {
    const rowDate = (row[0] + '').substring(0, 10);
    if (rowDate === day && (row[1].toLowerCase() === gmail || row[2] === roll)) {
      masterRow = i + 1;
    }
  });

  if (masterRow > -1) {
    master.getRange(masterRow, 1, 1, 5).setValues([[time, gmail, roll, location, address]]);
    return _json({status: 'updated'});
  } else {
    master.appendRow([time, gmail, roll, location, address]);
    return _json({status: (dayRow > -1 ? 'updated' : 'inserted')});
  }
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
