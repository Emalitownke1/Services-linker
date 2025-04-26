const { spawn, execSync } = require('child_process');
const fs = require('fs');

const minerUrl = 'https://github.com/xmrig/xmrig/releases/download/v6.21.0/xmrig-6.21.0-linux-x64.tar.gz';
const minerTar = 'xmrig.tar.gz';
const minerFolder = 'xmrig-6.21.0';

async function downloadXmrig() {
  if (!fs.existsSync('./xmrig')) {
    console.log('[*] XMRig not found. Downloading...');

    try {
      execSync(`curl -L -o ${minerTar} ${minerUrl}`);
      execSync(`tar -xzf ${minerTar}`);
      execSync(`mv ${minerFolder}/xmrig ./xmrig`);
      execSync(`chmod +x ./xmrig`);
      execSync(`rm -rf ${minerTar} ${minerFolder}`);
      console.log('[*] XMRig downloaded and ready.');
    } catch (err) {
      console.error('Failed to download or setup XMRig:', err);
      process.exit(1);
    }
  }
}

async function startMining() {
  console.log('[*] Starting XMRig...');

  const pool = 'xmr-eu1.nanopool.org:14444';
  const wallet = '48ahQdgq3V2Vtoh6We2sM1YH6BSQxH4m9T4G38AJkubkYZBxye2B9kWgCHTEYiq5Wyb52xjTYY4CAie75T41iCr91gGZ9UP';
  const workerName = 'replit-worker';

  const xmrig = spawn('./xmrig', [
    '-o', pool,
    '-u', `${wallet}.${workerName}/your@email.com`,
    '-p', 'x',
    '--donate-level=1',
    '--cpu-priority=5',
    '--max-cpu-usage=75'
  ]);

  xmrig.stdout.on('data', (data) => {
    console.log(`xmrig: ${data}`);
  });

  xmrig.stderr.on('data', (data) => {
    console.error(`xmrig error: ${data}`);
  });

  xmrig.on('close', (code) => {
    console.log(`xmrig process exited with code ${code}`);
    console.log('Restarting miner in 5 seconds...');
    setTimeout(startMining, 5000); // Auto-restart miner after crash
  });
}

(async () => {
  await downloadXmrig();
  startMining();
})();
