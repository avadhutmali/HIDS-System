package com.aegis.agent.data

import android.content.Context
import com.aegis.agent.data.api.ApiClient
import com.aegis.agent.data.model.AgentRegistrationRequest
import com.aegis.agent.data.model.AgentRegistrationResponse
import com.aegis.agent.data.model.HeartbeatRequest
import com.aegis.agent.data.model.HeartbeatResponse
import com.aegis.agent.data.model.PolicyResponse
import com.aegis.agent.data.model.ThreatReportRequest
import com.aegis.agent.data.model.ThreatReportResponse
import com.aegis.agent.data.model.TokenRefreshRequest
import com.aegis.agent.data.storage.TokenStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Response

class AgentRepository(context: Context) {

    private val api = ApiClient.service
    private val tokenStore = TokenStore(context.applicationContext)

    suspend fun register(request: AgentRegistrationRequest): Result<AgentRegistrationResponse> = withContext(Dispatchers.IO) {
        runCatching {
            val response = api.register(request)
            val body = response.bodyOrThrow("Registration failed")
            tokenStore.saveAuth(body.deviceId, body.jwtToken, body.refreshToken)
            tokenStore.savePolicy(body.policy)
            body
        }
    }

    suspend fun sendHeartbeat(request: HeartbeatRequest): Result<HeartbeatResponse> {
        return callWithAuthRetry("Heartbeat failed") { auth -> api.heartbeat(auth, request) }
            .map { body ->
                if (body.policyUpdated && body.policy != null) {
                    tokenStore.savePolicy(body.policy)
                }
                body
            }
    }

    suspend fun fetchPolicy(): Result<PolicyResponse> {
        return callWithAuthRetry("Policy fetch failed") { auth -> api.getPolicy(auth) }
            .map { policy ->
                tokenStore.savePolicy(policy)
                policy
            }
    }

    suspend fun reportThreat(request: ThreatReportRequest): Result<ThreatReportResponse> {
        return callWithAuthRetry("Threat report failed") { auth -> api.reportThreat(auth, request) }
    }

    fun getTokenStore(): TokenStore = tokenStore

    private suspend fun <T> callWithAuthRetry(
        failureMessage: String,
        call: suspend (authorization: String) -> Response<T>
    ): Result<T> = withContext(Dispatchers.IO) {
        runCatching {
            val jwt = tokenStore.getJwtToken() ?: error("Device is not enrolled")
            val initial = call("Bearer $jwt")

            // Retry on 401 (Unauthorized) OR 403 (Forbidden — Spring Security returns this
            // when an expired JWT silently fails validation and request proceeds as anonymous)
            if (initial.code() != 401 && initial.code() != 403) {
                return@runCatching initial.bodyOrThrow(failureMessage)
            }

            val refreshed = refreshTokenOrThrow()
            val retry = call("Bearer ${refreshed}")
            retry.bodyOrThrow(failureMessage)
        }
    }

    private suspend fun refreshTokenOrThrow(): String {
        val refreshToken = tokenStore.getRefreshToken() ?: error("Missing refresh token")
        val response = api.refreshToken(TokenRefreshRequest(refreshToken))
        val body = response.bodyOrThrow("Token refresh failed")
        tokenStore.saveJwt(body.jwtToken)
        tokenStore.saveRefreshToken(body.refreshToken)
        return body.jwtToken
    }

    private fun <T> Response<T>.bodyOrThrow(message: String): T {
        if (!isSuccessful || body() == null) {
            error("$message (HTTP ${code()})")
        }
        return body()!!
    }
}

