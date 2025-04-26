const { spawn } = require('child_process');
const path = require('path');

// Settings for Nanopool
const pool = 'xmr-eu1.nanopool.org:14444'; // Change server if needed
const wallet = '48ahQdgq3V2Vtoh6We2sM1YH6BSQxH4m9T4G38AJkubkYZBxye2B9kWgCHTEYiq5Wyb52xjTYY4CAie75T41iCr91gGZ9UP';
const workerName = 'heroku-worker';
const email = 'your@email.com'; // Optional: you can leave empty or use your email

// Full path to xmrig binary (adjust if needed)
const xmrigPath = path.join(__dirname, 'xmrig');

// Miner options
const xmrigArgs = [
  '-o', pool,
  '-u', `${wallet}.${workerName}/${email}`,
  '-p', 'x', // Password is usually just "x"
  '--donate-level=1',
  '--cpu-priority=5',
  '--max-cpu-usage=75'
];

// Simple logger with timestamps
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Function to start mining
function startMiner() {
  log('Starting XMRig...');
  
  const miner = spawn(xmrigPath, xmrigArgs);

  miner.stdout.on('data', (data) => {
    process.stdout.write(`[XMRig STDOUT] ${data}`);
  });

  miner.stderr.on('data', (data) => {
    process.stderr.write(`[XMRig STDERR] ${data}`);
  });

  miner.on('close', (code) => {
    log(`XMRig exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startMiner, 5000); // Auto-restart after 5 seconds
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    log('Stopping miner...');
    miner.kill('SIGINT');
    process.exit();
  });
}

// Start the miner
startMiner();
