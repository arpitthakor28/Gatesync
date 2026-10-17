package com.societysync.controller;

import com.societysync.dto.BillCreateDto;
import com.societysync.dto.MarkCashPaidDto;
import com.societysync.entity.Bill;
import com.societysync.security.UserPrincipal;
import com.societysync.service.BillService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/bills/generate")
    public List<Bill> generate(@RequestBody BillCreateDto dto) {
        return billService.generate(dto);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/admin/bills")
    public List<Bill> all() {
        return billService.all();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/admin/bills/mark-cash-paid")
    public Bill markCashPaid(@RequestBody MarkCashPaidDto dto, @AuthenticationPrincipal UserPrincipal principal) {
        return billService.markPaidCash(dto.billId(), principal.getUsername());
    }

    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN')")
    @PostMapping("/api/resident/bills/{billId}/mark-paid-online")
    public Bill markPaidOnline(@PathVariable Long billId) {
        return billService.markPaidOnline(billId);
    }

    // Flat number derived solely from verified JWT principal
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN')")
    @GetMapping("/api/resident/bills")
    public List<Bill> myBills(@AuthenticationPrincipal UserPrincipal principal) {
        return billService.forFlat(principal.getFlatNumber());
    }
}
