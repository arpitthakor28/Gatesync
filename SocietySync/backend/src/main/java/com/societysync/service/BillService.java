package com.societysync.service;

import com.societysync.dto.BillCreateDto;
import com.societysync.entity.Bill;
import com.societysync.entity.BillStatus;
import com.societysync.entity.Flat;
import com.societysync.entity.PaymentMethod;
import com.societysync.repository.BillRepository;
import com.societysync.repository.FlatRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Fixes the bug you flagged in the original app: the admin previously had only a
 * "cash" collection option with no online path. Here a bill can be closed out two ways:
 *   - RESIDENT marks it paid online (markPaidOnline) - a real gateway call is the
 *     obvious next step; this records the outcome and stamps PaymentMethod.ONLINE.
 *   - ADMIN marks it paid in cash (markPaidCash) - stamps PaymentMethod.CASH and
 *     records which admin collected it, for accountability.
 * Both paths converge on the same Bill/BillStatus model, so reporting doesn't fork.
 */
@Service
public class BillService {

    private final BillRepository billRepository;
    private final FlatRepository flatRepository;

    public BillService(BillRepository billRepository, FlatRepository flatRepository) {
        this.billRepository = billRepository;
        this.flatRepository = flatRepository;
    }

    public List<Bill> generate(BillCreateDto dto) {
        if (dto.flatNumber() != null && !dto.flatNumber().isBlank()) {
            return List.of(createOne(dto.flatNumber(), dto.billingMonth(), dto.amount()));
        }
        List<Flat> flats = flatRepository.findAll();
        return flats.stream()
                .map(f -> createOne(f.getFlatNumber(), dto.billingMonth(), dto.amount()))
                .toList();
    }

    private Bill createOne(String flatNumber, String billingMonth, java.math.BigDecimal amount) {
        Bill bill = new Bill();
        bill.setFlatNumber(flatNumber);
        bill.setBillingMonth(billingMonth);
        bill.setAmount(amount);
        bill.setStatus(BillStatus.PENDING);
        bill.setPaymentMethod(PaymentMethod.NONE);
        return billRepository.save(bill);
    }

    public Bill markPaidCash(Long billId, String adminLoginId) {
        Bill bill = getOrThrow(billId);
        bill.setStatus(BillStatus.PAID);
        bill.setPaymentMethod(PaymentMethod.CASH);
        bill.setCollectedByAdminLoginId(adminLoginId);
        bill.setPaidAt(Instant.now());
        return billRepository.save(bill);
    }

    /** Called after a successful online payment. Swap the body for a real gateway webhook handler when ready. */
    public Bill markPaidOnline(Long billId) {
        Bill bill = getOrThrow(billId);
        bill.setStatus(BillStatus.PAID);
        bill.setPaymentMethod(PaymentMethod.ONLINE);
        bill.setPaidAt(Instant.now());
        return billRepository.save(bill);
    }

    public List<Bill> forFlat(String flatNumber) {
        return billRepository.findByFlatNumberOrderByBillingMonthDesc(flatNumber);
    }

    public List<Bill> all() {
        return billRepository.findAllByOrderByBillingMonthDescFlatNumberAsc();
    }

    private Bill getOrThrow(Long id) {
        return billRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Bill not found"));
    }
}
