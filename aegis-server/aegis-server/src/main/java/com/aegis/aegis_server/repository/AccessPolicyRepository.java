package com.aegis.aegis_server.repository;

import com.aegis.aegis_server.domain.AccessPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccessPolicyRepository extends JpaRepository<AccessPolicy, Long> {

    default AccessPolicy getPolicy() {
        return findAll().stream().findFirst().orElse(null);
    }
}
