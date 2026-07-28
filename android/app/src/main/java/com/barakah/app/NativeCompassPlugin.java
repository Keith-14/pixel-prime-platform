package com.barakah.app;

import android.content.Context;
import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Uses Android's fused rotation-vector sensor and corrects it to true north. */
@CapacitorPlugin(name = "NativeCompass")
public class NativeCompassPlugin extends Plugin implements SensorEventListener {
  private static final double LOW_ACCURACY_DEGREES = 20.0;
  private SensorManager sensorManager;
  private Sensor rotationVectorSensor;
  @Nullable private Double latitude;
  @Nullable private Double longitude;

  @Override public void load() {
    sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
    rotationVectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
  }

  public void start(PluginCall call) {
    if (rotationVectorSensor == null) { call.reject("A fused compass sensor is not available on this device."); return; }
    latitude = call.getDouble("latitude");
    longitude = call.getDouble("longitude");
    sensorManager.unregisterListener(this);
    sensorManager.registerListener(this, rotationVectorSensor, SensorManager.SENSOR_DELAY_GAME);
    call.resolve();
  }

  public void stop(PluginCall call) { sensorManager.unregisterListener(this); call.resolve(); }
  @Override public void handleOnDestroy() { sensorManager.unregisterListener(this); }

  @Override public void onSensorChanged(SensorEvent event) {
    if (event.sensor.getType() != Sensor.TYPE_ROTATION_VECTOR) return;
    float[] rotationMatrix = new float[9];
    float[] orientation = new float[3];
    SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values);
    SensorManager.getOrientation(rotationMatrix, orientation);
    double heading = Math.toDegrees(orientation[0]);
    if (heading < 0) heading += 360.0;
    if (latitude != null && longitude != null) {
      GeomagneticField field = new GeomagneticField(latitude.floatValue(), longitude.floatValue(), 0f, System.currentTimeMillis());
      heading = normalize(heading + field.getDeclination());
    }
    double accuracy = event.values.length > 4 && event.values[4] >= 0 ? Math.toDegrees(event.values[4]) : accuracyFromStatus(event.accuracy);
    boolean needsCalibration = event.accuracy <= SensorManager.SENSOR_STATUS_ACCURACY_LOW || (accuracy >= 0 && accuracy > LOW_ACCURACY_DEGREES);
    JSObject payload = new JSObject();
    payload.put("heading", heading);
    payload.put("accuracy", accuracy);
    payload.put("needsCalibration", needsCalibration);
    notifyListeners("heading", payload);
  }

  @Override public void onAccuracyChanged(Sensor sensor, int accuracy) {}
  private static double normalize(double degrees) { return ((degrees % 360.0) + 360.0) % 360.0; }
  private static double accuracyFromStatus(int status) {
    switch (status) {
      case SensorManager.SENSOR_STATUS_ACCURACY_HIGH: return 5.0;
      case SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM: return 15.0;
      case SensorManager.SENSOR_STATUS_ACCURACY_LOW: return 30.0;
      default: return -1.0;
    }
  }
}
