package com.aegis.agent.data.model

import java.time.Instant

data class AgentRegistrationRequest(
    val prn: String,
    val deviceType: String,
    val deviceModel: String,
    val department: String,
    val consentAccepted: Boolean
)

data class AgentRegistrationResponse(
    val deviceId: String,
    val jwtToken: String,
    val refreshToken: String,
    val policy: PolicyResponse
)

data class HeartbeatRequest(
    val score: Int,
    val wifiBssid: String?,
    val ipAddress: String?,
    val scoreBreakdown: Map<String, Any>
)

data class HeartbeatResponse(
    val policyUpdated: Boolean,
    val erpAccessBlocked: Boolean,
    val policy: PolicyResponse?
)

data class PolicyResponse(
    val erpMinScore: Int,
    val knownBssids: List<String>,
    val appWhitelist: List<String>,
    val erpAccessBlocked: Boolean,
    val updatedAt: String?
)

data class ThreatReportRequest(
    val eventType: String,
    val severity: String,
    val occurredAt: String,
    val payload: Map<String, Any>
)

data class ThreatReportResponse(
    val eventId: Long,
    val queued: Boolean
)

data class TokenRefreshRequest(
    val refreshToken: String
)

data class TokenRefreshResponse(
    val jwtToken: String,
    val refreshToken: String
)

fun nowIsoString(): String = Instant.now().toString()

