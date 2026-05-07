package com.aegis.aegis_server.repository;

import com.aegis.aegis_server.domain.PatientZeroCluster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientZeroClusterRepository extends JpaRepository<PatientZeroCluster, Long> {

    List<PatientZeroCluster> findAllByOrderByFirstSeenDesc();
}
