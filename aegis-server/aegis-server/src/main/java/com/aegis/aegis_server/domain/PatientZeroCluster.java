package com.aegis.aegis_server.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "patient_zero_clusters")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PatientZeroCluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "threat_pattern", nullable = false, length = 100)
    private String threatPattern;

    @Column(name = "patient_zero_id")
    private UUID patientZeroId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_zero_id", insertable = false, updatable = false)
    private Device patientZeroDevice;

    @Column(name = "affected_devices", columnDefinition = "uuid[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private UUID[] affectedDevices;

    @Column(name = "first_seen", nullable = false)
    private Instant firstSeen;

    @Column(name = "spread_count", nullable = false)
    @Builder.Default
    private Integer spreadCount = 1;
}
