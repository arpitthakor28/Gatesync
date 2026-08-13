package com.gatesync.repository.jpa;

import com.gatesync.model.Flat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FlatRepository extends JpaRepository<Flat, Long> {
    List<Flat> findByBlock(String block);
}
