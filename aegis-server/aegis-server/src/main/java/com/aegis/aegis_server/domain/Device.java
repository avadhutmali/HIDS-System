package com.aegis.aegis_server.domain;

import com.aegis.aegis_server.domain.enums.DeviceType;
import com.aegis.aegis_server.domain.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "devices")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Device {

    @Id
    private UUID id;

    @Column(nullable = false, length = 20)
    private String prn;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false)
    private DeviceType deviceType;

    @Column(name = "device_model", length = 100)
    private String deviceModel;

    @Column(name = "current_score", nullable = false)
    @Builder.Default
    private Integer currentScore = 100;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    @Builder.Default
    private RiskLevel riskLevel = RiskLevel.CLEAN;

    @Column(length = 50)
    private String department;

    @Column(name = "last_seen", nullable = false)
    @Builder.Default
    private Instant lastSeen = Instant.now();

    @Column(name = "erp_access_blocked", nullable = false)
    @Builder.Default
    private Boolean erpAccessBlocked = false;

    @Column(name = "enrolled_at", nullable = false)
    @Builder.Default
    private Instant enrolledAt = Instant.now();

    @Column(name = "consent_accepted", nullable = false)
    @Builder.Default
    private Boolean consentAccepted = true;
}
