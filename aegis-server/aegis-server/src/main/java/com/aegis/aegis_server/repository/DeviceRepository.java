package com.aegis.aegis_server.repository;

import com.aegis.aegis_server.domain.Device;
import com.aegis.aegis_server.domain.enums.DeviceType;
import com.aegis.aegis_server.domain.enums.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface DeviceRepository extends JpaRepository<Device, UUID> {

    List<Device> findByPrn(String prn);

    @Query("SELECT d FROM Device d WHERE " +
           "(:department IS NULL OR d.department = :department) AND " +
           "(:riskLevel IS NULL OR d.riskLevel = :riskLevel) AND " +
           "(:deviceType IS NULL OR d.deviceType = :deviceType)")
    Page<Device> findWithFilters(
            @Param("department") String department,
            @Param("riskLevel") RiskLevel riskLevel,
            @Param("deviceType") DeviceType deviceType,
            Pageable pageable);

    @Query("SELECT COUNT(d) FROM Device d WHERE d.lastSeen > :since")
    Long countOnlineSince(@Param("since") Instant since);

    Long countByRiskLevel(RiskLevel riskLevel);
}
