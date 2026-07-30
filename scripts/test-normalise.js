// Checks the duplicate-URL matching rules, and optionally scans a real library
// file for clashes those rules would now catch.
//
//   node scripts/test-normalise.js
//   node scripts/test-normalise.js "$HOME/Library/Application Support/com.damienbutler.documanage/library.json"
const TRACKING = /^(utm_|fbclid|gclid|mc_[ce]id|ref|referrer|source|WT\.)/i;

function normaliseUrl(raw) {
  let text = String(raw || '').trim();
  if (!text) return '';
  if (!/^https?:\/\//i.test(text)) text = 'https://' + text;
  try {
    const u = new URL(text);
    u.protocol = u.protocol.toLowerCase();
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
    if ((u.protocol === 'https:' && u.port === '443') ||
        (u.protocol === 'http:' && u.port === '80')) u.port = '';
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
    [...u.searchParams.keys()].forEach((k) => { if (TRACKING.test(k)) u.searchParams.delete(k); });
    return u.toString();
  } catch {
    return text.toLowerCase();
  }
}

const same = (a, b) => normaliseUrl(a) === normaliseUrl(b);

const cases = [
  ['trailing slash ignored',        'https://docs.github.com/rest/',            'https://docs.github.com/rest',  true],
  ['www ignored',                   'https://www.docs.github.com/rest',         'https://docs.github.com/rest',  true],
  ['scheme/host case ignored',      'HTTPS://Docs.GitHub.com/rest',             'https://docs.github.com/rest',  true],
  ['tracking params stripped',      'https://docs.github.com/rest?utm_source=x','https://docs.github.com/rest',  true],
  ['missing scheme assumed https',  'docs.github.com/rest',                     'https://docs.github.com/rest',  true],
  ['default port ignored',          'https://docs.github.com:443/rest',         'https://docs.github.com/rest',  true],
  ['anchors stay distinct',         'https://d.com/page#install',               'https://d.com/page#usage',      false],
  ['paths stay distinct',           'https://d.com/a',                          'https://d.com/b',               false],
  ['meaningful query kept',         'https://d.com/p?version=2',                'https://d.com/p?version=3',     false],
  ['path case preserved',           'https://d.com/Page',                       'https://d.com/page',            false],
];

let pass = 0;
for (const [name, a, b, want] of cases) {
  const ok = same(a, b) === want;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
console.log(`\n${pass}/${cases.length} rules passed`);

// --- optional: scan a real library ------------------------------------------

const libraryPath = process.argv[2];
if (libraryPath) {
  const fs = require('node:fs');
  const lib = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
  const seen = new Map();
  const clashes = [];
  let total = 0;

  for (const product of lib.productOrder || Object.keys(lib.products || {})) {
    for (const doc of (lib.products[product] || {}).docs || []) {
      total++;
      const key = normaliseUrl(doc.url);
      if (seen.has(key)) clashes.push([seen.get(key), `${product} › ${doc.title}`]);
      else seen.set(key, `${product} › ${doc.title}`);
    }
  }

  console.log(`\nScanned ${total} documents`);
  if (clashes.length === 0) {
    console.log('No duplicate URLs.');
  } else {
    console.log(`${clashes.length} duplicate URL(s) found:`);
    clashes.forEach(([a, b]) => console.log(`  "${a}"\n    clashes with "${b}"`));
  }
}

process.exit(pass === cases.length ? 0 : 1);
