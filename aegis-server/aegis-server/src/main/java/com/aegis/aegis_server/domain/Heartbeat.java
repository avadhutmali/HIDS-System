package com.aegis.aegis_server.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "heartbeats")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Heartbeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "wifi_bssid", length = 20)
    private String wifiBssid;

    @JdbcTypeCode(SqlTypes.INET)
    @Column(name = "ip_address", columnDefinition = "inet")
    private String ipAddress;

    @Column(nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();
}
