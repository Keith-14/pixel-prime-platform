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
    contentInset: 'always',
    backgroundColor: '#FFF5E5',
    infoPlist: {
      NSCameraUsageDescription:
        'Barakah uses the camera to scan barcodes for halal product verification.',
      NSMicrophoneUsageDescription:
        'Barakah uses the microphone so you can ask the AI assistant questions by voice.',
      NSSpeechRecognitionUsageDescription:
        'Barakah uses speech recognition to turn your voice questions into text for the AI assistant.',
      NSLocationWhenInUseUsageDescription:
        'Barakah uses your location to provide prayer times and nearby place recommendations.',
    },
  },
};

export default config;
