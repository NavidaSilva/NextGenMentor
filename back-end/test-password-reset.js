#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🧪 Running Admin Password Reset Tests...\n');

// Run the password reset tests
const testProcess = spawn('npx', ['jest', 'tests/admin-password-reset.test.js', '--verbose'], {
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All password reset tests passed!');
  } else {
    console.log('\n❌ Some tests failed. Check the output above.');
    process.exit(code);
  }
});

testProcess.on('error', (err) => {
  console.error('❌ Error running tests:', err);
  process.exit(1);
});
