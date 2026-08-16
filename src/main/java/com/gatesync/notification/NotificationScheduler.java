package com.gatesync.notification;

import com.gatesync.model.User;
import com.gatesync.model.VisitorRequest;
import com.gatesync.model.VisitorStatus;
import com.gatesync.repository.jpa.UserRepository;
import com.gatesync.repository.jpa.VisitorRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final VisitorRequestRepository visitorRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 30000)
    public void sendPendingReminders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(1);

        List<VisitorRequest> pendingRequests = visitorRequestRepository.findByStatusAndCreatedAtBefore(
                VisitorStatus.PENDING,
                cutoff
        );

        for (VisitorRequest request : pendingRequests) {
            String block = request.getTargetBlock() != null ? request.getTargetBlock() : "A";
            String flat = request.getTargetFlat() != null ? request.getTargetFlat() : "101";

            Optional<User> residentOpt = userRepository.findByBlockNumberAndFlatNumber(block, flat);
            String phone = residentOpt.map(User::getPhone).orElse(request.getVisitorPhone());
            Long residentId = residentOpt.map(User::getId).orElse(null);

            if (phone != null && !phone.isBlank()) {
                log.info("Sending reminder alert for Visitor Request #{} (Flat {}-{})", request.getId(), block, flat);
                notificationService.sendSmsOnce(request, phone, residentId, NotificationPurpose.REMINDER);
            }
        }
    }
}
