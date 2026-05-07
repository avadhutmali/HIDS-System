package com.aegis.agent.security

import android.annotation.SuppressLint
import android.app.KeyguardManager
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.provider.Settings
import com.aegis.agent.data.storage.TokenStore

class ScoreEngine(private val context: Context) {

    private val tokenStore = TokenStore(context)

    fun compute(): SecurityScoreResult {
        val policy = tokenStore.getPolicy()
        val knownBssids = policy?.knownBssids?.toSet().orEmpty()

        val bssid = currentBssid()
        val signals = SecuritySignals(
            rooted = isLikelyRooted(),
            developerOptionsEnabled = isDeveloperOptionsEnabled(),
            screenLockEnabled = isScreenLockEnabled(),
            dangerousAppsOutsideWhitelist = 0,
            connectedBssidKnown = bssid == null || knownBssids.contains(bssid)
        )

        return SecurityScoreCalculator.calculate(signals)
    }

    @SuppressLint("MissingPermission")
    fun currentBssid(): String? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // API 31+: get WifiInfo via ConnectivityManager
            val cm = context.applicationContext
                .getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val network = cm?.activeNetwork ?: return null
            val caps = cm.getNetworkCapabilities(network) ?: return null
            val wifiInfo = caps.transportInfo as? WifiInfo ?: return null
            val bssid = wifiInfo.bssid
            if (bssid.isNullOrBlank() || bssid == "02:00:00:00:00:00") null else bssid
        } else {
            @Suppress("DEPRECATION")
            val wifiManager = context.applicationContext
                .getSystemService(Context.WIFI_SERVICE) as? WifiManager
            val bssid = wifiManager?.connectionInfo?.bssid
            if (bssid.isNullOrBlank() || bssid == "02:00:00:00:00:00") null else bssid
        }
    }

    private fun isDeveloperOptionsEnabled(): Boolean {
        return runCatching {
            Settings.Global.getInt(
                context.contentResolver,
                Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,
                0
            ) == 1
        }.getOrDefault(false)
    }

    private fun isScreenLockEnabled(): Boolean {
        val keyguard = context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
        return keyguard?.isDeviceSecure ?: false
    }

    private fun isLikelyRooted(): Boolean {
        if (Build.TAGS?.contains("test-keys") == true) return true
        val suPaths = listOf(
            "/system/bin/su",
            "/system/xbin/su",
            "/sbin/su",
            "/system/app/Superuser.apk",
            "/system/bin/.ext/.su"
        )
        return suPaths.any { path -> runCatching { java.io.File(path).exists() }.getOrDefault(false) }
    }
}

