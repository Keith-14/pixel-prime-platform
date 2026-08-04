import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface CompassHeading {
  /** Degrees clockwise from true north. */
  heading: number;
  /** Estimated heading error in degrees; -1 means the platform cannot estimate it. */
  accuracy: number;
  /** True when the device needs a figure-eight calibration. */
  needsCalibration: boolean;
}

export interface NativeCompassPlugin {
  start(options?: { latitude?: number; longitude?: number }): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: 'heading',
    listenerFunc: (heading: CompassHeading) => void,
  ): Promise<PluginListenerHandle>;
}

export const NativeCompass = registerPlugin<NativeCompassPlugin>('NativeCompass');
