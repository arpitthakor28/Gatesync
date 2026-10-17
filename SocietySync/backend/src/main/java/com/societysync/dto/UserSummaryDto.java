package com.societysync.dto;

import com.societysync.entity.User;

// Never return the User entity directly from a controller - it carries passwordHash.
// This is the safe projection every admin-facing endpoint should return instead.
public record UserSummaryDto(
    Long id,
    String loginId,
    String role,
    String fullName,
    String mobile,
    String flatNumber
) {
    public static UserSummaryDto from(User user) {
        return new UserSummaryDto(
            user.getId(), user.getLoginId(), user.getRole().name(),
            user.getFullName(), user.getMobile(), user.getFlatNumber()
        );
    }
}
