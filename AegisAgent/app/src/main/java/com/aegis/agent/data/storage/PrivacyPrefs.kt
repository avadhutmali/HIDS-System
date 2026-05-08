package com.aegis.agent.data.storage

import android.content.Context

class PrivacyPrefs(context: Context) {

    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun isConsentAccepted(): Boolean = prefs.getBoolean(KEY_CONSENT_ACCEPTED, false)

    fun setConsentAccepted(accepted: Boolean) {
        prefs.edit().putBoolean(KEY_CONSENT_ACCEPTED, accepted).apply()
    }

    companion object {
        private const val PREFS_NAME = "aegis_agent_prefs"
        private const val KEY_CONSENT_ACCEPTED = "consent_accepted"
    }
}
