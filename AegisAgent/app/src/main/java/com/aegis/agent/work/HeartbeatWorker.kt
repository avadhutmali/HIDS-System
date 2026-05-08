package com.aegis.agent.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.aegis.agent.data.AgentRepository
import com.aegis.agent.data.model.HeartbeatRequest
import com.aegis.agent.security.ScoreEngine
import com.aegis.agent.security.WifiTrustMonitor

class HeartbeatWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val repository = AgentRepository(applicationContext)
        val tokenStore = repository.getTokenStore()

        if (!tokenStore.isEnrolled()) {
            return Result.success()
        }

        val policy = tokenStore.getPolicy()
        WifiTrustMonitor.checkAndNotify(
            applicationContext,
            policy?.knownBssids?.toSet().orEmpty()
        )

        val scoreEngine = ScoreEngine(applicationContext)
        val scoreResult = scoreEngine.compute()

        val request = HeartbeatRequest(
            score = scoreResult.score,
            wifiBssid = scoreEngine.currentBssid(),
            ipAddress = null,
            scoreBreakdown = scoreResult.breakdown
        )

        return repository.sendHeartbeat(request)
            .fold(
                onSuccess = { Result.success() },
                onFailure = { Result.retry() }
            )
    }
}

