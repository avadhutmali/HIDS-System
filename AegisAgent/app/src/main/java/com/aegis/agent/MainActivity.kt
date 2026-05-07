package com.aegis.agent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.tooling.preview.Preview
import com.aegis.agent.BuildConfig
import com.aegis.agent.data.AgentRepository
import com.aegis.agent.data.model.AgentRegistrationRequest
import com.aegis.agent.data.model.HeartbeatRequest
import com.aegis.agent.data.model.ThreatReportRequest
import com.aegis.agent.data.model.nowIsoString
import com.aegis.agent.security.ScoreEngine
import com.aegis.agent.ui.theme.AegisAgentTheme
import com.aegis.agent.work.AgentWorkScheduler
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        AgentWorkScheduler.scheduleHeartbeat(this)

        setContent {
            AegisAgentTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    AgentScreen(
                        modifier = Modifier.padding(innerPadding),
                        repository = AgentRepository(this)
                    )
                }
            }
        }
    }
}

@Composable
fun AgentScreen(modifier: Modifier = Modifier, repository: AgentRepository) {
    val context = LocalContext.current
    val tokenStore = repository.getTokenStore()
    var enrolled by remember { mutableStateOf(tokenStore.isEnrolled()) }
    var status by remember { mutableStateOf("Ready") }
    val scope = rememberCoroutineScope()

    var prn by rememberSaveable { mutableStateOf("") }
    var deviceModel by rememberSaveable { mutableStateOf(android.os.Build.MODEL ?: "ANDROID") }
    var department by rememberSaveable { mutableStateOf("CSE") }
    var consentAccepted by rememberSaveable { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(text = "Aegis Android Agent")
        Text(text = "Server: ${BuildConfig.SERVER_BASE_URL}")

        if (!enrolled) {
            OutlinedTextField(
                value = prn,
                onValueChange = { prn = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("PRN") }
            )
            OutlinedTextField(
                value = deviceModel,
                onValueChange = { deviceModel = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Device model") }
            )
            OutlinedTextField(
                value = department,
                onValueChange = { department = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Department") }
            )
            RowWithCheckbox(
                checked = consentAccepted,
                label = "Consent accepted",
                onCheckedChange = { consentAccepted = it }
            )

            Button(
                onClick = {
                    scope.launch {
                        status = "Registering..."
                        val request = AgentRegistrationRequest(
                            prn = prn.trim(),
                            deviceType = "ANDROID",
                            deviceModel = deviceModel.trim(),
                            department = department.trim(),
                            consentAccepted = consentAccepted
                        )

                        repository.register(request)
                            .onSuccess {
                                enrolled = true
                                status = "Enrollment complete"
                                AgentWorkScheduler.triggerImmediateHeartbeat(context)
                            }
                            .onFailure { status = "Register failed: ${it.message}" }
                    }
                },
                enabled = prn.isNotBlank() && consentAccepted
            ) {
                Text("Enroll Device")
            }
        } else {
            Button(onClick = {
                scope.launch {
                    status = "Sending heartbeat..."
                    val scoreEngine = ScoreEngine(context)
                    val score = scoreEngine.compute()
                    repository.sendHeartbeat(
                        HeartbeatRequest(
                            score = score.score,
                            wifiBssid = scoreEngine.currentBssid(),
                            ipAddress = null,
                            scoreBreakdown = score.breakdown
                        )
                    ).onSuccess {
                        status = "Heartbeat sent (score ${score.score})"
                    }.onFailure {
                        status = "Heartbeat failed: ${it.message}"
                    }
                }
            }) {
                Text("Send Heartbeat")
            }

            Button(onClick = {
                scope.launch {
                    status = "Fetching policy..."
                    repository.fetchPolicy()
                        .onSuccess { status = "Policy synced. Min score: ${it.erpMinScore}" }
                        .onFailure { status = "Policy fetch failed: ${it.message}" }
                }
            }) {
                Text("Sync Policy")
            }

            Button(onClick = {
                scope.launch {
                    status = "Reporting threat..."
                    repository.reportThreat(
                        ThreatReportRequest(
                            eventType = "EVIL_TWIN",
                            severity = "HIGH",
                            occurredAt = nowIsoString(),
                            payload = mapOf("source" to "manual-test", "description" to "Triggered from app")
                        )
                    ).onSuccess {
                        status = "Threat queued with id ${it.eventId}"
                    }.onFailure {
                        status = "Threat failed: ${it.message}"
                    }
                }
            }) {
                Text("Send Test Threat")
            }
        }

        Text(text = "Status: $status")
    }
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    AegisAgentTheme {
        Text("Aegis Android Agent")
    }
}

@Composable
private fun RowWithCheckbox(checked: Boolean, label: String, onCheckedChange: (Boolean) -> Unit) {
    androidx.compose.foundation.layout.Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Checkbox(checked = checked, onCheckedChange = onCheckedChange)
        Text(text = label)
    }
}