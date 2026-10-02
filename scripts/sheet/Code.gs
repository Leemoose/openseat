// Live funnel sheet for Kindling. Paste this whole file into the Google Sheet's
// Extensions > Apps Script editor. Setup steps are in scripts/sheet/README.md.
//
// The site POSTs one JSON object per event to this script's web app URL, and
// each becomes a row on the "Events" tab. The "Funnel" tab counts unique
// visitors at each step with formulas, so it updates as rows arrive.

const EVENTS = 'Events'
const FUNNEL = 'Funnel'
const COLUMNS = ['Time', 'Visitor', 'Event', 'Page', 'Hobby', 'Class', 'Venue', 'Price shown', 'Price arm', 'Source', 'Site']
// Only the public site is counted, so test clicks from a laptop
// (localhost) show up in Events but never in the funnel numbers.
const LIVE_SITE = 'leemoose.github.io'

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const d = JSON.parse(e.postData.contents)
    sheet_(EVENTS).appendRow([
      new Date(), d.visitor || '', d.event || '', d.page || '', d.hobby || '',
      d.session || '', d.venue || '', d.price || '', d.variant || '', d.src || '', d.site || '',
    ])
  } finally {
    lock.releaseLock()
  }
  return ContentService.createTextOutput('ok')
}

// Run once from the editor (select "setup", press Run). Safe to re-run: it
// rebuilds the Funnel tab and leaves recorded events alone.
function setup() {
  const ev = sheet_(EVENTS)
  ev.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]).setFontWeight('bold')
  ev.setFrozenRows(1)

  const f = sheet_(FUNNEL)
  f.clear()
  const visitors = `Events!B2:B`
  const live = `Events!K2:K=$E$2`
  f.getRange('A1').setValue('Kindling funnel (live)').setFontWeight('bold').setFontSize(14)
  f.getRange('D2:E2').setValues([['Counting site:', LIVE_SITE]])
  f.getRange('A3:C3').setValues([['Step', 'People', '% of visitors']]).setFontWeight('bold')
  // ROWS(UNIQUE(...)), not COUNTUNIQUE: when FILTER finds nothing it returns
  // #N/A, and COUNTUNIQUE counts that error as one value, so an empty step
  // read 1. UNIQUE passes the error through and IFERROR turns it into 0.
  const people = (...conds) => `=IFERROR(ROWS(UNIQUE(FILTER(${visitors}, ${[live, ...conds].join(', ')}))), 0)`
  f.getRange('A4:A6').setValues([['Opened the site'], ['Opened a hobby'], ['Tapped Hold my seat']])
  f.getRange('B4:B6').setFormulas([
    [people()],
    [people('LEFT(Events!D2:D, 3)="/h/"')],
    [people('Events!C2:C="hold_click"')],
  ])
  f.getRange('C4:C6').setFormulas([['=IF($B$4=0, "", B4/$B$4)'], ['=IF($B$4=0, "", B5/$B$4)'], ['=IF($B$4=0, "", B6/$B$4)']])
  f.getRange('C4:C6').setNumberFormat('0%')
  f.getRange('A8').setFormula(`="Total Hold my seat taps: " & COUNTIFS(Events!C2:C, "hold_click", Events!K2:K, $E$2)`)
  f.getRange('A9').setValue('People are counted once per browser, however many times they do the step.').setFontColor('#777777')
  f.autoResizeColumns(1, 5)
  SpreadsheetApp.getActive().setActiveSheet(f)
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActive()
  return ss.getSheetByName(name) || ss.insertSheet(name)
}
