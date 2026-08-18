package com.gatesync.repository.jpa;

import com.gatesync.model.CommunityProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityProblemRepository extends JpaRepository<CommunityProblem, Long> {
    List<CommunityProblem> findBySocietyIdOrderByCreatedAtDesc(String societyId);
    List<CommunityProblem> findByReporterNameOrderByCreatedAtDesc(String reporterName);
}
