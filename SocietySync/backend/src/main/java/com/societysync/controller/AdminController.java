package com.societysync.controller;

import com.societysync.dto.CreateGuardRequest;
import com.societysync.dto.CreateResidentRequest;
import com.societysync.dto.UserSummaryDto;
import com.societysync.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    // Returns UserSummaryDto, never the User entity directly - the entity carries passwordHash.
    @PostMapping("/residents")
    public UserSummaryDto createResident(@RequestBody CreateResidentRequest req) {
        return UserSummaryDto.from(userService.createResident(req));
    }

    @PostMapping("/guards")
    public UserSummaryDto createGuard(@RequestBody CreateGuardRequest req) {
        return UserSummaryDto.from(userService.createGuard(req));
    }
}
