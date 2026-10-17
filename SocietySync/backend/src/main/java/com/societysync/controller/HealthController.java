package com.societysync.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    private final Instant startTime = Instant.now();

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "GateSync Platform API",
                "version", "2.0.0",
                "timestamp", Instant.now(),
                "uptimeSeconds", Instant.now().getEpochSecond() - startTime.getEpochSecond()
        ));
    }
}
