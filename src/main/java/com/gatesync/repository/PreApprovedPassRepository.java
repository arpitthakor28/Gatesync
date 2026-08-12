package com.gatesync.repository;

import com.gatesync.model.PreApprovedPass;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PreApprovedPassRepository extends JpaRepository<PreApprovedPass, Long> {
    Optional<PreApprovedPass> findByPassCode(String passCode);
    List<PreApprovedPass> findByResidentFlatOrderByCreatedAtDesc(String residentFlat);
}
