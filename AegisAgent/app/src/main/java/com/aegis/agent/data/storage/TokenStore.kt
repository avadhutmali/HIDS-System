package com.aegis.agent.data.storage

import android.content.Context
import com.aegis.agent.data.model.PolicyResponse
import com.google.gson.Gson

class TokenStore(context: Context) {

    private val prefs = context.getSharedPreferences("aegis_agent_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    fun saveAuth(deviceId: String, jwtToken: String, refreshToken: String) {
        prefs.edit()
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_JWT, jwtToken)
            .putString(KEY_REFRESH, refreshToken)
            .apply()
    }

    fun saveJwt(jwtToken: String) {
        prefs.edit().putString(KEY_JWT, jwtToken).apply()
    }

    fun saveRefreshToken(refreshToken: String) {
        prefs.edit().putString(KEY_REFRESH, refreshToken).apply()
    }

    fun savePolicy(policy: PolicyResponse) {
        prefs.edit().putString(KEY_POLICY_JSON, gson.toJson(policy)).apply()
    }

    fun getJwtToken(): String? = prefs.getString(KEY_JWT, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH, null)

    fun getDeviceId(): String? = prefs.getString(KEY_DEVICE_ID, null)

    fun getPolicy(): PolicyResponse? {
        val raw = prefs.getString(KEY_POLICY_JSON, null) ?: return null
        return runCatching { gson.fromJson(raw, PolicyResponse::class.java) }.getOrNull()
    }

    fun isEnrolled(): Boolean = !getDeviceId().isNullOrBlank() && !getJwtToken().isNullOrBlank()

    companion object {
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_JWT = "jwt_token"
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_POLICY_JSON = "policy_json"
    }
}

