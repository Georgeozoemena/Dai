import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

const API_URL = 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
  process.env.EXPO_PUBLIC_BACKEND_URL || 
  'http://localhost:5000';

/**
 * Test Backend Connection
 * 
 * Verifies that the backend is reachable and responding
 * 
 * NOTE: This should NOT be called automatically on every bootstrap!
 * Only call this explicitly during development/debugging.
 */
export async function testBackendConnection(options?: { 
  skipIdentityCheck?: boolean;
  showAlert?: boolean;
}) {
  const { skipIdentityCheck = false, showAlert = false } = options || {};

  console.log('='.repeat(50));
  console.log('🔍 BACKEND CONNECTION TEST');
  console.log('='.repeat(50));
  console.log('Platform:', Platform.OS);
  console.log('API URL:', API_URL);
  console.log('='.repeat(50));

  const tests = [
    {
      name: 'Health Check',
      url: `${API_URL}/health`,
      method: 'GET',
    },
  ];

  // Only add identity check if explicitly requested
  if (!skipIdentityCheck) {
    tests.push({
      name: 'Identity Check',
      url: `${API_URL}/api/identity/check`,
      method: 'POST',
      body: { email: 'test@example.com' },
    });
  }

  const results: Array<{ name: string; success: boolean; message: string }> = [];

  for (const test of tests) {
    try {
      console.log(`\n📡 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Method: ${test.method}`);

      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
        console.log(`   Body:`, test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.json();

      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Response:`, data);

      results.push({
        name: test.name,
        success: response.ok,
        message: `${response.status} - ${JSON.stringify(data)}`,
      });
    } catch (error) {
      console.error(`   ❌ Error:`, error);
      results.push({
        name: test.name,
        success: false,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  const allPassed = results.every((r) => r.success);
  
  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
  });
  
  console.log('='.repeat(50));

  // Show alert with results (only if requested)
  if (showAlert && Platform.OS !== 'web') {
    const message = results
      .map((r) => `${r.success ? '✅' : '❌'} ${r.name}`)
      .join('\n');

    Alert.alert(
      allPassed ? 'Connection Test Passed! ✅' : 'Connection Test Failed ❌',
      message,
      [{ text: 'OK' }]
    );
  }

  return { allPassed, results };
}

/**
 * Get platform-specific backend URL recommendations
 */
export function getBackendURLRecommendations() {
  const recommendations = {
    ios: 'http://localhost:5000',
    android: 'http://10.0.2.2:5000',
    web: 'http://localhost:5000',
  };

  console.log('\n📱 Platform-Specific Backend URL Recommendations:');
  console.log('='.repeat(50));
  console.log('iOS Simulator:    ', recommendations.ios);
  console.log('Android Emulator: ', recommendations.android);
  console.log('Web:              ', recommendations.web);
  console.log('Physical Device:  ', 'http://YOUR_COMPUTER_IP:5000');
  console.log('='.repeat(50));
  console.log('\n💡 Current Platform:', Platform.OS);
  console.log('💡 Recommended URL:', recommendations[Platform.OS as keyof typeof recommendations]);
  console.log('💡 Current URL:    ', API_URL);
  console.log('='.repeat(50));

  return recommendations;
}
