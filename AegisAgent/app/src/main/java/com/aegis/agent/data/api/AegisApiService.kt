package com.aegis.agent.data.api

import com.aegis.agent.data.model.AgentRegistrationRequest
import com.aegis.agent.data.model.AgentRegistrationResponse
import com.aegis.agent.data.model.HeartbeatRequest
import com.aegis.agent.data.model.HeartbeatResponse
import com.aegis.agent.data.model.PolicyResponse
import com.aegis.agent.data.model.ThreatReportRequest
import com.aegis.agent.data.model.ThreatReportResponse
import com.aegis.agent.data.model.TokenRefreshRequest
import com.aegis.agent.data.model.TokenRefreshResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface AegisApiService {

    @POST("api/v1/agent/register")
    suspend fun register(@Body request: AgentRegistrationRequest): Response<AgentRegistrationResponse>

    @POST("api/v1/agent/heartbeat")
    suspend fun heartbeat(
        @Header("Authorization") authorization: String,
        @Body request: HeartbeatRequest
    ): Response<HeartbeatResponse>

    @GET("api/v1/agent/policy")
    suspend fun getPolicy(@Header("Authorization") authorization: String): Response<PolicyResponse>

    @POST("api/v1/threats/report")
    suspend fun reportThreat(
        @Header("Authorization") authorization: String,
        @Body request: ThreatReportRequest
    ): Response<ThreatReportResponse>

    @POST("api/v1/agent/token/refresh")
    suspend fun refreshToken(@Body request: TokenRefreshRequest): Response<TokenRefreshResponse>
}

