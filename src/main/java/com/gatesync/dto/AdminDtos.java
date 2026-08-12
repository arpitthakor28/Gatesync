package com.gatesync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AdminDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateUserRequest {
        private String loginId;
        private String password;
        private String fullName;
        private String email;
        private String phone;
        private String role; // ADMIN, GUARD, RESIDENT
        private String blockNumber;
        private String flatNumber;
        private String shiftSchedule;
        private String gateAssigned;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardStats {
        private long totalResidents;
        private long activeGuards;
        private long totalFlats;
        private long visitorsToday;
        private long pendingRequests;
        private long approvedToday;
        private long deniedToday;
    }
}
