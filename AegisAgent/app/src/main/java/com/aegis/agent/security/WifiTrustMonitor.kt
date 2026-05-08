package com.aegis.agent.security

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.aegis.agent.R
import java.util.concurrent.TimeUnit

object WifiTrustMonitor {

    private const val CHANNEL_ID = "aegis_wifi_alerts"
    private const val CHANNEL_NAME = "Aegis Wi-Fi Alerts"
    private const val TARGET_SSID = "WCE Wi-Fi 6"

    private const val PREFS_NAME = "aegis_agent_prefs"
    private const val KEY_LAST_ALERT_BSSID = "last_untrusted_bssid"
    private const val KEY_LAST_ALERT_AT = "last_untrusted_bssid_at"

    private val cooldownMs = TimeUnit.MINUTES.toMillis(10)

    fun checkAndNotify(context: Context, knownBssids: Set<String>) {
        if (knownBssids.isEmpty()) return

        val wifiInfo = currentWifiInfo(context) ?: return
        val ssid = sanitizeSsid(wifiInfo.ssid)
        val bssid = wifiInfo.bssid

        if (ssid != TARGET_SSID) return
        if (bssid.isNullOrBlank() || bssid == "02:00:00:00:00:00") return
        if (knownBssids.contains(bssid)) return

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastBssid = prefs.getString(KEY_LAST_ALERT_BSSID, null)
        val lastAt = prefs.getLong(KEY_LAST_ALERT_AT, 0L)
        val now = System.currentTimeMillis()

        if (lastBssid == bssid && now - lastAt < cooldownMs) return

        ensureChannel(context)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Untrusted WIFI-6 detected")
            .setContentText("Connected to WIFI-6 with unknown BSSID: $bssid")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        NotificationManagerCompat.from(context).notify(1001, notification)

        prefs.edit()
            .putString(KEY_LAST_ALERT_BSSID, bssid)
            .putLong(KEY_LAST_ALERT_AT, now)
            .apply()
    }

    private fun currentWifiInfo(context: Context): WifiInfo? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val network = cm?.activeNetwork ?: return null
            val caps = cm.getNetworkCapabilities(network) ?: return null
            caps.transportInfo as? WifiInfo
        } else {
            @Suppress("DEPRECATION")
            val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            @Suppress("DEPRECATION")
            wifiManager?.connectionInfo
        }
    }

    private fun sanitizeSsid(rawSsid: String?): String? {
        if (rawSsid.isNullOrBlank()) return null
        return rawSsid.trim().trim('"')
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return

        val existing = manager.getNotificationChannel(CHANNEL_ID)
        if (existing != null) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        )
        manager.createNotificationChannel(channel)
    }
}
