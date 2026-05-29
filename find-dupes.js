const XLSX = require('xlsx');
const wb = XLSX.readFile('data/inventory.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const firstColKey = Object.keys(rawData[0])[0];
const seen = new Map();
const dupes = [];

for (const row of rawData.slice(1)) {
  const code = (row.__EMPTY_3 || '').toString().trim();
  const name = (row.__EMPTY || '').toString().trim();
  if (!code || !name) continue;
  if (seen.has(code)) {
    dupes.push({ code, first: seen.get(code), duplicate: name });
  } else {
    seen.set(code, name);
  }
}

console.log('DUPLICATE CODES (' + dupes.length + ' found):\n');
dupes.forEach((d, i) => {
  console.log((i + 1) + '. Code: ' + d.code);
  console.log('   ADDED (first):      ' + d.first);
  console.log('   NOT ADDED (dupe):   ' + d.duplicate);
  console.log('');
});
