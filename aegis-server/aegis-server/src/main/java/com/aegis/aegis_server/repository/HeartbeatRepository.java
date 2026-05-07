package com.aegis.aegis_server.repository;

import com.aegis.aegis_server.domain.Heartbeat;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HeartbeatRepository extends JpaRepository<Heartbeat, Long> {

    List<Heartbeat> findByDeviceIdOrderByTimestampDesc(UUID deviceId, Pageable pageable);
}
