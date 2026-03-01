import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paymind.app',
  appName: 'PayMind',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
