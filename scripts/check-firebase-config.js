#!/usr/bin/env node

/**
 * Firebase Configuration Checker
 * Verifies that Firebase is properly configured
 */

console.log('🔍 Checking Firebase Configuration...\n');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('\n📝 To fix this:');
  console.log('   1. Copy .env.example to .env:');
  console.log('      cp .env.example .env');
  console.log('   2. Fill in your Firebase configuration values');
  console.log('   3. See docs/FIREBASE_SETUP_GUIDE.md for detailed instructions\n');
  process.exit(1);
}

console.log('✅ .env file exists');

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

// Check required Firebase variables
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const foundVars = {};
let allConfigured = true;

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      foundVars[key.trim()] = value.trim();
    }
  }
});

console.log('\n📋 Checking Firebase configuration variables:\n');

requiredVars.forEach(varName => {
  const value = foundVars[varName];
  if (!value || value.includes('your_') || value.includes('your-')) {
    console.log(`❌ ${varName}: Not configured`);
    allConfigured = false;
  } else {
    // Mask the value for security
    const masked = value.length > 10 
      ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
      : '***';
    console.log(`✅ ${varName}: ${masked}`);
  }
});

if (!allConfigured) {
  console.log('\n❌ Firebase is not fully configured!');
  console.log('\n📝 To fix this:');
  console.log('   1. Go to https://console.firebase.google.com/');
  console.log('   2. Select your project (or create one)');
  console.log('   3. Go to Project Settings (gear icon)');
  console.log('   4. Scroll to "Your apps" and copy the config values');
  console.log('   5. Paste them into your .env file');
  console.log('   6. See docs/FIREBASE_SETUP_GUIDE.md for detailed instructions\n');
  process.exit(1);
}

console.log('\n✅ All Firebase configuration variables are set!');

// Check if firestore.rules exists
const rulesPath = path.join(process.cwd(), 'firestore.rules');
if (fs.existsSync(rulesPath)) {
  console.log('✅ firestore.rules file exists');
} else {
  console.log('⚠️  firestore.rules file not found (optional)');
}

console.log('\n🎉 Firebase configuration looks good!');
console.log('\n📝 Next steps:');
console.log('   1. Make sure Authentication is enabled in Firebase Console');
console.log('   2. Enable Email/Password and Google Sign-In providers');
console.log('   3. Create Firestore database');
console.log('   4. Deploy security rules: firebase deploy --only firestore:rules');
console.log('   5. Restart your dev server: npm run dev');
console.log('\n📚 See docs/FIREBASE_SETUP_GUIDE.md for complete setup instructions\n');
