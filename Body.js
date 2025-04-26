const { spawn } = require('child_process');

// Replace these with your actual pool and wallet address
const pool = 'pool.minexmr.com:4444';
const wallet = 'YOUR_MONERO_WALLET_ADDRESS';
const workerName = 'heroku-worker';

const xmrig = spawn('./xmrig', [
  '-o', pool,
  '-u', wallet,
  '-p', workerName,
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
});
