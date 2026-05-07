# Quick Start Guide for AegisAgent

## Prerequisites

1. **Android Studio** (Hedgehog or later)
2. **Android SDK 36** (compileSdk)
3. **Gradle 9.4.1** (included with Android Studio)
4. **Java 11+**
5. **Aegis Spring Boot Server** running on `http://localhost:8080`

## Build Steps

### Option 1: Using Android Studio IDE

1. Open `D:\Projects\HIDS-System\AegisAgent` in Android Studio
2. Wait for Gradle sync to complete
3. Select `app` module
4. Click **Build > Make Project**
5. Wait for completion

### Option 2: Using Gradle CLI

```powershell
# Navigate to project
Set-Location "D:\Projects\HIDS-System\AegisAgent"

# Full clean build
.\gradlew.bat clean :app:assembleDebug

# Incremental build
.\gradlew.bat :app:assembleDebug

# Expected output
# BUILD SUCCESSFUL in ~2-3 minutes
# Output: app\build\outputs\apk\debug\app-debug.apk
```

### Option 3: Using Gradle Wrapper on Windows

```cmd
cd D:\Projects\HIDS-System\AegisAgent
gradlew.bat :app:assembleDebug
```

## Running on Emulator

### Step 1: Start Android Emulator

```powershell
# Using Android Studio Device Manager or:
emulator -avd Pixel_6_API_36
```

### Step 2: Install APK

```powershell
adb install -r D:\Projects\HIDS-System\AegisAgent\app\build\outputs\apk\debug\app-debug.apk
```

### Step 3: Launch App

```powershell
adb shell am start -n com.aegis.agent/.MainActivity
```

## Testing the Agent

### Test 1: Device Enrollment

1. **App opens** → Shows enrollment form
2. **Enter enrollment data:**
   - PRN: `2024001`
   - Device model: (auto-filled, e.g., `generic_x86_64`)
   - Department: `CSE`
3. **Check consent** box
4. **Click "Enroll Device"** button
5. **Expected:** Status shows "Enrollment complete"

### Test 2: Send Heartbeat

1. **After enrollment**, click **"Send Heartbeat"** button
2. **Expected results:**
   - App calculates security score
   - Status shows: "Heartbeat sent (score XX)"
   - Server receives request at `/api/v1/agent/heartbeat`

### Test 3: Sync Policy

1. **Click "Sync Policy"** button
2. **Expected results:**
   - Policy fetches from server
   - Status shows: "Policy synced. Min score: 60"

### Test 4: Report Threat

1. **Click "Send Test Threat"** button
2. **Expected results:**
   - EVIL_TWIN threat event sent
   - Status shows: "Threat queued with id [eventId]"
   - Server receives request at `/api/v1/threats/report`

## Troubleshooting

### Build Errors

**Error:** `Plugin 'org.jetbrains.kotlin.android' not found`
- Fix: Remove `kotlin("android")` from plugins block (already done)

**Error:** `Cannot find symbol` for BuildConfig
- Fix: Run `./gradlew clean` and rebuild

**Error:** Network connection timeout
- Fix: Ensure Spring Boot server is running on port 8080

### Runtime Errors

**Error:** `java.net.ConnectException: Connection refused`
- **Cause:** Server not running or wrong URL
- **Fix:** 
  - Debug builds use: `http://10.0.2.2:8080/` (correct for emulator)
  - Verify server is running: `curl http://localhost:8080/actuator/health`

**Error:** `401 Unauthorized` on heartbeat
- **Cause:** Device not enrolled or JWT expired
- **Fix:** Re-enroll device, clear app data if needed

**Error:** `SharedPreferences` permission denied
- **Fix:** Should not occur with modern Android, but clear app data if persists

## View Logs

### Using Android Studio Logcat

1. Open **Logcat** tool window
2. Filter by package: `com.aegis.agent`
3. Look for tags:
   - `AegisApi` - HTTP requests/responses
   - `HeartbeatWorker` - Background work events

### Using ADB

```powershell
adb logcat | Select-String "com.aegis.agent"
```

## Server Integration Verification

### Check if Agent Connected

```bash
# On server machine
curl -X GET http://localhost:8080/api/v1/admin/devices \
  -H "Authorization: Bearer {admin-jwt}"
```

Should show enrolled device with ID and PRN.

### Monitor RabbitMQ Queue

Access RabbitMQ management at: `http://localhost:15672`
- Default username: `aegis`
- Default password: `aegis123`

Look for queues:
- `aegis.telemetry.events` - Heartbeat events
- `aegis.threat.alerts` - Threat events

## Expected HTTP Traffic Flow

### On Enrollment
```
POST /api/v1/agent/register
Request:  {prn, deviceType, deviceModel, department, consentAccepted}
Response: {deviceId, jwtToken, refreshToken, policy}
```

### On Heartbeat (every 30 minutes)
```
POST /api/v1/agent/heartbeat
Header:   Authorization: Bearer {jwtToken}
Request:  {score, wifiBssid, ipAddress, scoreBreakdown}
Response: {policyUpdated, erpAccessBlocked, policy?}
```

### On Policy Sync
```
GET /api/v1/agent/policy
Header:   Authorization: Bearer {jwtToken}
Response: {erpMinScore, knownBssids, appWhitelist, erpAccessBlocked}
```

### On Threat Report
```
POST /api/v1/threats/report
Header:   Authorization: Bearer {jwtToken}
Request:  {eventType, severity, occurredAt, payload}
Response: {eventId, queued}
```

## Performance Notes

- **Enrollment:** ~1-2 seconds (one-time)
- **Heartbeat:** ~500ms (periodic, background)
- **Policy Sync:** ~500ms (on-demand)
- **Threat Report:** ~200ms (immediate, low latency)

## Device Score Calculation

The security score is calculated based on:

```
Base Score: 100
├─ Rooted Device:              -30 (if true)
├─ Developer Options Enabled:  -20 (if true)
├─ Screen Lock Disabled:       -15 (if false)
├─ Dangerous Apps Unwhitelisted: -10 each (max -25)
└─ Unknown WiFi BSSID:          -5 (if not in policy)

Final Score: Base - Penalties (min 0, max 100)
```

## Common Development Tasks

### Update Server URL

**Debug build:** Edit `app/build.gradle.kts`
```gradle
debug {
    buildConfigField("String", "SERVER_BASE_URL", "\"http://10.0.2.2:8080/\"")
}
```

**Release build:** 
```gradle
release {
    buildConfigField("String", "SERVER_BASE_URL", "\"https://aegis.wce.ac.in/\"")
}
```

### Add Custom Threat Type

1. Add to server's [EventType enum](../aegis-server/src/main/java/com/aegis/aegis_server/domain/enums/EventType.java)
2. Update Android sendThreat in MainActivity.kt

### Extend Security Score

Edit `ScoreEngine.kt` to add new security checks:
```kotlin
if (someNewCheck) penalties["newCheck"] = 10
```

## Support & Debugging

For detailed logs, enable debug logging:

```kotlin
// In ApiClient.kt, set level to BODY:
val logging = HttpLoggingInterceptor { message -> Log.d("AegisApi", message) }.apply {
    level = HttpLoggingInterceptor.Level.BODY  // Shows request/response bodies
}
```

## Next: Integration Testing

Once build succeeds:
1. ✅ Build APK
2. ➡️ Install on emulator
3. ➡️ Run enrollment test
4. ➡️ Verify server receives requests
5. ➡️ Check RabbitMQ for events
6. ➡️ Verify dashboard updates

**All 6 steps = Successful integration!**

