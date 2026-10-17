package com.societysync.controller;

import com.societysync.dto.VisitorDecisionDto;
import com.societysync.dto.VisitorRequestCreateDto;
import com.societysync.entity.VisitorRequest;
import com.societysync.security.UserPrincipal;
import com.societysync.service.VisitorService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class VisitorController {

    private final VisitorService visitorService;

    public VisitorController(VisitorService visitorService) {
        this.visitorService = visitorService;
    }

    // Guard logs a visitor at the gate
    @PreAuthorize("hasAnyRole('GUARD', 'ADMIN')")
    @PostMapping("/api/guard/visitor-requests")
    public VisitorRequest create(@Valid @RequestBody VisitorRequestCreateDto dto,
                                 @AuthenticationPrincipal UserPrincipal principal) {
        return visitorService.createRequest(dto, principal.getUsername(), principal.getSocietyId());
    }

    // Active pending queue for guards on duty in the current society
    @PreAuthorize("hasAnyRole('GUARD', 'ADMIN')")
    @GetMapping("/api/guard/visitor-requests")
    public List<VisitorRequest> guardActiveQueue(@AuthenticationPrincipal UserPrincipal principal) {
        return visitorService.pendingForGuard(principal.getSocietyId());
    }

    // Full visitor history for the society
    @PreAuthorize("hasAnyRole('GUARD', 'ADMIN')")
    @GetMapping("/api/guard/visitor-requests/history")
    public List<VisitorRequest> visitorHistory(@AuthenticationPrincipal UserPrincipal principal) {
        return visitorService.historyForSociety(principal.getSocietyId());
    }

    // Guard checks out an approved visitor
    @PreAuthorize("hasAnyRole('GUARD', 'ADMIN')")
    @PostMapping("/api/guard/visitor-requests/{id}/checkout")
    public VisitorRequest checkout(@PathVariable Long id,
                                   @AuthenticationPrincipal UserPrincipal principal) {
        return visitorService.checkout(id, principal.getSocietyId(), principal.getUsername());
    }

    // Resident approves or rejects visitor arrival
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN')")
    @PostMapping("/api/resident/visitor-requests/decision")
    public VisitorRequest decide(@RequestBody VisitorDecisionDto dto,
                                 @AuthenticationPrincipal UserPrincipal principal) {
        return visitorService.decide(
                dto.requestId(),
                dto.approved(),
                dto.denialReason(),
                principal.getUsername(),
                principal.getSocietyId(),
                principal.getFlatNumber()
        );
    }

    // Resident views pending requests strictly for their own verified flat and society
    @PreAuthorize("hasAnyRole('RESIDENT', 'ADMIN')")
    @GetMapping("/api/resident/visitor-requests/pending")
    public List<VisitorRequest> pendingForMe(@AuthenticationPrincipal UserPrincipal principal) {
        return visitorService.pendingForFlat(principal.getSocietyId(), principal.getFlatNumber());
    }
}
