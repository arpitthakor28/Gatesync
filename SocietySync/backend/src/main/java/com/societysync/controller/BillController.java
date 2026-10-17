package com.societysync.controller;

import com.societysync.dto.BillCreateDto;
import com.societysync.dto.MarkCashPaidDto;
import com.societysync.entity.Bill;
import com.societysync.service.BillService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @PostMapping("/api/admin/bills/generate")
    public List<Bill> generate(@RequestBody BillCreateDto dto) {
        return billService.generate(dto);
    }

    @GetMapping("/api/admin/bills")
    public List<Bill> all() {
        return billService.all();
    }

    // The fix for the "admin only has cash" bug: this endpoint marks it paid in cash.
    @PostMapping("/api/admin/bills/mark-cash-paid")
    public Bill markCashPaid(@RequestBody MarkCashPaidDto dto, Authentication auth) {
        return billService.markPaidCash(dto.billId(), auth.getName());
    }

    // ...and this is the other half of the fix: residents now have an online path too.
    // Wire this to a real payment gateway callback/webhook when you add one.
    @PostMapping("/api/resident/bills/{billId}/mark-paid-online")
    public Bill markPaidOnline(@PathVariable Long billId) {
        return billService.markPaidOnline(billId);
    }

    @GetMapping("/api/resident/bills")
    public List<Bill> myBills(@RequestParam String flatNumber) {
        return billService.forFlat(flatNumber);
    }
}
