package com.societysync.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class VisitorExpiryScheduler {

    private final VisitorService visitorService;

    public VisitorExpiryScheduler(VisitorService visitorService) {
        this.visitorService = visitorService;
    }

    // A visitor request nobody responds to for 10 minutes auto-expires, so the guard
    // isn't left waiting forever if a resident's phone is off or unreachable.
    @Scheduled(fixedRate = 60_000)
    public void expireStale() {
        visitorService.expireStaleRequests(10);
    }
}
