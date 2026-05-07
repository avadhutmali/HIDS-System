package com.aegis.agent.security

data class SecuritySignals(
    val rooted: Boolean,
    val developerOptionsEnabled: Boolean,
    val screenLockEnabled: Boolean,
    val dangerousAppsOutsideWhitelist: Int,
    val connectedBssidKnown: Boolean
)

data class SecurityScoreResult(
    val score: Int,
    val breakdown: Map<String, Any>
)

object SecurityScoreCalculator {

    fun calculate(signals: SecuritySignals): SecurityScoreResult {
        var score = 100
        val penalties = linkedMapOf<String, Int>()

        if (signals.rooted) penalties["rooted"] = 30
        if (signals.developerOptionsEnabled) penalties["developerOptions"] = 20
        if (!signals.screenLockEnabled) penalties["screenLockDisabled"] = 15

        val appPenalty = (signals.dangerousAppsOutsideWhitelist * 10).coerceAtMost(25)
        if (appPenalty > 0) penalties["dangerousApps"] = appPenalty

        if (!signals.connectedBssidKnown) penalties["unknownBssid"] = 5

        penalties.values.forEach { score -= it }
        score = score.coerceIn(0, 100)

        return SecurityScoreResult(
            score = score,
            breakdown = mapOf(
                "baseScore" to 100,
                "penalties" to penalties,
                "finalScore" to score
            )
        )
    }
}

