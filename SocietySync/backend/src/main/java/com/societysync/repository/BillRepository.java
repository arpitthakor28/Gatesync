package com.societysync.repository;

import com.societysync.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByFlatNumberOrderByBillingMonthDesc(String flatNumber);
    List<Bill> findAllByOrderByBillingMonthDescFlatNumberAsc();
}
