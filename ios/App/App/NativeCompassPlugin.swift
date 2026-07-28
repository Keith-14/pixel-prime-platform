import Capacitor
import CoreLocation
import CoreMotion

/**
 * Delivers Core Motion's fused device-motion heading. Core Location runs in
 * parallel solely to report heading accuracy and request the system's compass
 * calibration UI when magnetic interference is detected.
 */
@objc(NativeCompassPlugin)
public class NativeCompassPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "NativeCompassPlugin"
    public let jsName = "NativeCompass"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
    ]
    private let motionManager = CMMotionManager()
    private let locationManager = CLLocationManager()
    private var headingAccuracy: CLLocationDirection = -1
    private var usesDeviceMotion = false
    private let lowAccuracyDegrees: CLLocationDirection = 20

    public override func load() {
        locationManager.delegate = self
        locationManager.headingFilter = kCLHeadingFilterNone
    }

    @objc func start(_ call: CAPPluginCall) {
        guard CLLocationManager.headingAvailable() else {
            call.reject("A compass sensor is not available on this device.")
            return
        }

        locationManager.startUpdatingHeading()
        startFusedMotionUpdates()
        call.resolve()
    }

    @objc func stop(_ call: CAPPluginCall) {
        motionManager.stopDeviceMotionUpdates()
        locationManager.stopUpdatingHeading()
        usesDeviceMotion = false
        call.resolve()
    }

    public override func handleOnDestroy() {
        motionManager.stopDeviceMotionUpdates()
        locationManager.stopUpdatingHeading()
    }

    private func startFusedMotionUpdates() {
        guard motionManager.isDeviceMotionAvailable else {
            usesDeviceMotion = false
            return
        }

        let frames = CMMotionManager.availableAttitudeReferenceFrames()
        let frame: CMAttitudeReferenceFrame = frames.contains(.xTrueNorthZVertical)
            ? .xTrueNorthZVertical
            : .xMagneticNorthZVertical
        guard frames.contains(frame) else {
            usesDeviceMotion = false
            return
        }

        usesDeviceMotion = true
        motionManager.deviceMotionUpdateInterval = 1.0 / 30.0
        motionManager.startDeviceMotionUpdates(using: frame, to: .main) { [weak self] motion, _ in
            guard let self, let motion else { return }
            self.emit(heading: motion.heading)
        }
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        headingAccuracy = newHeading.headingAccuracy
        // Fall back to the native Core Location compass only on older devices
        // where fused Core Motion device motion is not available.
        if !usesDeviceMotion {
            let heading = newHeading.trueHeading >= 0 ? newHeading.trueHeading : newHeading.magneticHeading
            emit(heading: heading)
        }
    }

    public func locationManagerShouldDisplayHeadingCalibration(_ manager: CLLocationManager) -> Bool {
        return headingAccuracy < 0 || headingAccuracy > lowAccuracyDegrees
    }

    private func emit(heading: CLLocationDirection) {
        let normalizedHeading = ((heading.truncatingRemainder(dividingBy: 360)) + 360)
            .truncatingRemainder(dividingBy: 360)
        let needsCalibration = headingAccuracy < 0 || headingAccuracy > lowAccuracyDegrees
        notifyListeners("heading", data: [
            "heading": normalizedHeading,
            "accuracy": headingAccuracy,
            "needsCalibration": needsCalibration,
        ])
    }
}

class NativeCompassBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(NativeCompassPlugin())
    }
}
