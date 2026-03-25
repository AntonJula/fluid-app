/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
try {
  const result = execSync('npm run build', { encoding: 'utf8' });
  console.log("SUCCESS:", result);
} catch (e) {
  console.error("ERROR STDERR:", e.stderr);
  console.error("ERROR STDOUT:", e.stdout);
}
