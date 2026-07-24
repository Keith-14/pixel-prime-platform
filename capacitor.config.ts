import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.barakah.services',
  appName: 'Barakah',
  webDir: 'dist',
  bundledWebRuntime: false,

  server: {
    hostname: 'localhost',
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#2D190F",
      androidSplashResourceName: "splash",
      showSpinner: false
    }
  },

  ios: {
    scheme: 'com.barakah.services',
    contentInset: 'never',
    backgroundColor: '#2D190F',
    infoPlist: {
      NSCameraUsageDescription:
        'Barakah uses the camera to scan barcodes for halal product verification.',
      NSLocationWhenInUseUsageDescription:
        'Barakah uses your location to provide prayer times and nearby place recommendations.',
    },
  },
};

export default config;
