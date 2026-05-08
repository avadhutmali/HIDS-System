package com.aegis.agent.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import com.aegis.agent.data.storage.TokenStore
import com.aegis.agent.security.WifiTrustMonitor

class WifiStateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != WifiManager.NETWORK_STATE_CHANGED_ACTION) return

        val policy = TokenStore(context).getPolicy()
        WifiTrustMonitor.checkAndNotify(
            context.applicationContext,
            policy?.knownBssids?.toSet().orEmpty()
        )
    }
}
