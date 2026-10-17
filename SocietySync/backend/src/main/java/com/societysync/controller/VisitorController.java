package com.societysync.controller;

import com.societysync.dto.VisitorDecisionDto;
import com.societysync.dto.VisitorRequestCreateDto;
import com.societysync.entity.VisitorRequest;
import com.societysync.service.VisitorService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class VisitorController {

    private final VisitorService visitorService;

    public VisitorController(VisitorService visitorService) {
        this.visitorService = visitorService;
    }

    // Guard logs a visitor at the gate -> triggers the real-time popup to the resident
    @PostMapping("/api/guard/visitor-requests")
    public VisitorRequest create(@Valid @RequestBody VisitorRequestCreateDto dto, Authentication auth) {
        return visitorService.createRequest(dto, auth.getName());
    }

    @GetMapping("/api/guard/visitor-requests")
    public List<VisitorRequest> guardHistory(Authentication auth) {
        return visitorService.pendingForGuard(auth.getName());
    }

    // Resident approves/rejects from the popup
    @PostMapping("/api/resident/visitor-requests/decision")
    public VisitorRequest decide(@RequestBody VisitorDecisionDto dto, Authentication auth) {
        return visitorService.decide(dto.requestId(), dto.approved(), auth.getName());
    }

    @GetMapping("/api/resident/visitor-requests/pending")
    public List<VisitorRequest> pendingForMe(Authentication auth, @RequestParam String flatNumber) {
        return visitorService.pendingForFlat(flatNumber);
    }
}
