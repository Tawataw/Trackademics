const fs = require('fs');
let code = fs.readFileSync('src/engine/admission.ts', 'utf8');

code = code.replace(
  /en: \`Group requirement: \$\{allowed\.join\(\', \'\)\} — \$\{isAllowed \? \'satisfied\' : \'not satisfied\. Selected: \' \+ current\}\`,/,
  "en: \`Group requirement: \$\{allowed.join(', ')\} - \$\{isAllowed ? 'satisfied' : 'not satisfied'\}. Selected: \$\{current\}\`,"
);

fs.writeFileSync('src/engine/admission.ts', code);
