# Phone Installation Instructions

## Your Setup
- **Laptop IP:** 10.40.7.242
- **Spring Boot Server:** Running on http://10.40.7.242:8080
- **Phone:** Connected via USB with developer mode enabled
- **APK:** Built with your laptop IP configured

## Installation Steps

### 1. First Time: Build the APK
```powershell
cd D:\Projects\HIDS-System\AegisAgent
.\gradlew.bat clean :app:assembleDebug
```

**Wait for: BUILD SUCCESSFUL**

### 2. Verify Phone Connection
```powershell
adb devices
```

**Expected output:**
```
List of attached devices
XXXXX device
```

If shows "unauthorized", unplug phone and plug back in, then tap "Allow" on phone.

### 3. Install APK on Phone
```powershell
adb install -r D:\Projects\HIDS-System\AegisAgent\app\build\outputs\apk\debug\app-debug.apk
```

**Wait for: Success**

### 4. Launch App
```powershell
adb shell am start -n com.aegis.agent/.MainActivity
```

App should open on your phone screen!

## Testing on Phone

### Test 1: Enrollment
1. App opens → Shows enrollment form
2. Fill in:
   - PRN: `2024001`
   - Device model: (auto-filled)
   - Department: `CSE`
3. Check "Consent accepted"
4. Tap "Enroll Device"
5. **Expected:** Status shows "Enrollment complete" ✅

### Test 2: Heartbeat
1. Tap "Send Heartbeat"
2. **Expected:** "Heartbeat sent (score XX)" ✅
3. Check laptop logs:
   ```powershell
   # In another terminal, on server machine:
   curl http://10.40.7.242:8080/api/v1/admin/devices
   ```

### Test 3: Policy Sync
1. Tap "Sync Policy"
2. **Expected:** "Policy synced. Min score: 60" ✅

### Test 4: Threat Report
1. Tap "Send Test Threat"
2. **Expected:** "Threat queued with id [ID]" ✅

## View Phone Logs in Real-Time

```powershell
adb logcat | Select-String "com.aegis.agent"
```

This shows everything the app is doing - useful for debugging!

## Verify Server Received Data

### Check Spring Boot Server Logs
```
Look for messages like:
- "Device registered: [deviceId]"
- "Threat report queued"
- "Heartbeat processed"
```

### Check RabbitMQ Events
```
Visit: http://localhost:15672
Login: aegis / aegis123
Look for queues:
- aegis.telemetry.events (heartbeat)
- aegis.threat.alerts (threat)
```

### Check Admin Dashboard
```
Visit: http://localhost:5173 (or your dashboard URL)
Login and look for your device in the device list
```

## Troubleshooting

### Phone shows "Connection refused"
- Verify: `ipconfig` on laptop shows 10.40.7.242
- Verify: Spring Boot server running on port 8080
- Verify: Phone is on same WiFi as laptop
- Try: Disable firewall temporarily to test

### ADB shows "unauthorized"
- Unplug phone USB cable
- Wait 5 seconds
- Plug back in
- Tap "Allow USB debugging" on phone prompt
- Run `adb devices` again

### Installation fails
- Phone storage might be full
- Try: `adb shell pm clear com.aegis.agent` then reinstall
- Or: Uninstall first: `adb uninstall com.aegis.agent`

### App crashes on startup
- Check logs: `adb logcat | Select-String "com.aegis.agent"`
- Most common: Can't reach server (check 10.40.7.242:8080 is accessible)

## Quick Commands Reference

```powershell
# Build
.\gradlew.bat :app:assembleDebug

# Install
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Launch
adb shell am start -n com.aegis.agent/.MainActivity

# View logs
adb logcat -e "com.aegis.agent"

# Uninstall
adb uninstall com.aegis.agent

# Clear app data
adb shell pm clear com.aegis.agent
```

## IP Address Configuration

Your current config in `app/build.gradle.kts`:
```gradle
debug {
    buildConfigField("String", "SERVER_BASE_URL", "\"http://10.40.7.242:8080/\"")
}
```

This is set correctly. When you rebuild, the APK will use your laptop's IP to reach the server.

---

**Ready to test? Run the commands above in order!** 🚀

