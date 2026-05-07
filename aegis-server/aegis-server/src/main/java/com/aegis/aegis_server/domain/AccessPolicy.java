package com.aegis.aegis_server.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "access_policies")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AccessPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "erp_min_score", nullable = false)
    @Builder.Default
    private Integer erpMinScore = 60;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "alert_thresholds", columnDefinition = "jsonb")
    private Map<String, String> alertThresholds;

    @Column(name = "app_whitelist", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] appWhitelist;

    @Column(name = "known_bssids", columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    private String[] knownBssids;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
