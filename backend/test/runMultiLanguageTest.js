#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Multi-Language AI Test Suite...\n');

// Run the test
const testProcess = spawn('node', [join(__dirname, 'multiLanguageTest.js')], {
    stdio: 'inherit',
    env: { ...process.env }
});

testProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ All tests completed successfully!');
    } else {
        console.log(`\n❌ Tests failed with exit code ${code}`);
    }
    process.exit(code);
});

testProcess.on('error', (error) => {
    console.error('❌ Failed to start test process:', error);
    process.exit(1);
});