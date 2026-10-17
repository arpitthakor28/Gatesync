package com.societysync.service;

import com.societysync.dto.NotificationEvent;
import com.societysync.entity.User;
import com.societysync.entity.VisitorRequest;
import com.societysync.entity.VisitorStatus;
import com.societysync.mongo.document.EscalationTaskDocument;
import com.societysync.mongo.document.NotificationDocument;
import com.societysync.mongo.repository.EscalationTaskRepository;
import com.societysync.repository.UserRepository;
import com.societysync.repository.VisitorRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class EscalationService {

    private static final Logger log = LoggerFactory.getLogger(EscalationService.class);

    private final EscalationTaskRepository escalationTaskRepository;
    private final VisitorRequestRepository visitorRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public EscalationService(EscalationTaskRepository escalationTaskRepository,
                             VisitorRequestRepository visitorRequestRepository,
                             UserRepository userRepository,
                             @Lazy NotificationService notificationService,
                             SimpMessagingTemplate messagingTemplate) {
        this.escalationTaskRepository = escalationTaskRepository;
        this.visitorRequestRepository = visitorRequestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Schedules persisted escalation tasks in MongoDB.
     * Survives any Render server restarts.
     */
    public void scheduleForRequest(VisitorRequest request) {
        Instant now = Instant.now();

        // 1. 60s reminder to resident
        EscalationTaskDocument task60s = new EscalationTaskDocument();
        task60s.setSocietyId(request.getSocietyId());
        task60s.setRequestId(request.getId());
        task60s.setFlatNumber(request.getFlatNumber());
        task60s.setStage(EscalationTaskDocument.EscalationStage.REMINDER_60S);
        task60s.setTriggerAt(now.plus(60, ChronoUnit.SECONDS));
        escalationTaskRepository.save(task60s);

        // 2. 120s No Response escalation to guard desk
        EscalationTaskDocument task120s = new EscalationTaskDocument();
        task120s.setSocietyId(request.getSocietyId());
        task120s.setRequestId(request.getId());
        task120s.setFlatNumber(request.getFlatNumber());
        task120s.setStage(EscalationTaskDocument.EscalationStage.NO_RESPONSE_120S);
        task120s.setTriggerAt(now.plus(120, ChronoUnit.SECONDS));
        escalationTaskRepository.save(task120s);

        // 3. 10m auto-expire
        EscalationTaskDocument taskExpire = new EscalationTaskDocument();
        taskExpire.setSocietyId(request.getSocietyId());
        taskExpire.setRequestId(request.getId());
        taskExpire.setFlatNumber(request.getFlatNumber());
        taskExpire.setStage(EscalationTaskDocument.EscalationStage.EXPIRE_TIMEOUT);
        taskExpire.setTriggerAt(now.plus(10, ChronoUnit.MINUTES));
        escalationTaskRepository.save(taskExpire);

        log.info("[EscalationService] Scheduled MongoDB escalation tasks for requestId={}", request.getId());
    }

    /**
     * Cancel/clear escalation tasks when resident decides on visitor
     */
    public void cancelForRequest(Long requestId) {
        escalationTaskRepository.deleteByRequestId(requestId);
        log.info("[EscalationService] Cleared escalation tasks for resolved requestId={}", requestId);
    }

    /**
     * Background scanner checking every 10 seconds for tasks due
     */
    @Scheduled(fixedRate = 10_000)
    @Transactional
    public void processDueEscalations() {
        Instant now = Instant.now();
        List<EscalationTaskDocument> dueTasks = escalationTaskRepository.findByExecutedFalseAndTriggerAtBefore(now);
        if (dueTasks.isEmpty()) return;

        for (EscalationTaskDocument task : dueTasks) {
            try {
                processSingleTask(task);
            } catch (Exception e) {
                log.error("[EscalationService] Error executing escalation task {}: {}", task.getId(), e.getMessage());
            } finally {
                task.setExecuted(true);
                task.setExecutedAt(Instant.now());
                escalationTaskRepository.save(task);
            }
        }
    }

    private void processSingleTask(EscalationTaskDocument task) {
        Optional<VisitorRequest> opt = visitorRequestRepository.findById(task.getRequestId());
        if (opt.isEmpty()) return;

        VisitorRequest request = opt.get();
        // If request is already resolved, do nothing
        if (request.getStatus() != VisitorStatus.PENDING) {
            return;
        }

        // Find resident user for flat
        Optional<User> residentOpt = userRepository.findByFlatNumber(request.getFlatNumber());
        String residentMobile = residentOpt.map(User::getMobile).orElse("");
        String residentName = residentOpt.map(User::getFullName).orElse("Resident");
        Long residentUserId = residentOpt.map(User::getId).orElse(0L);
        String residentLoginId = residentOpt.map(User::getLoginId).orElse("");

        Map<String, Object> payload = new HashMap<>();
        payload.put("requestId", request.getId());
        payload.put("visitorName", request.getVisitorName());
        payload.put("flatNumber", request.getFlatNumber());
        payload.put("visitorPhone", request.getVisitorPhone());
        payload.put("residentMobile", residentMobile);
        payload.put("residentName", residentName);

        if (task.getStage() == EscalationTaskDocument.EscalationStage.REMINDER_60S) {
            log.info("[EscalationService] Dispatching 60s reminder to Flat {}", request.getFlatNumber());
            notificationService.dispatch(new NotificationEvent(
                    request.getSocietyId(),
                    residentUserId,
                    residentLoginId,
                    request.getFlatNumber(),
                    NotificationDocument.NotificationType.VISITOR_REQUEST,
                    NotificationDocument.NotificationPriority.HIGH,
                    "🔔 Reminder: Visitor Waiting at Gate",
                    request.getVisitorName() + " is waiting at the gate for Flat " + request.getFlatNumber() + ". Please approve or deny entry.",
                    payload,
                    "reminder_60s_" + request.getId(),
                    Instant.now().plus(60, ChronoUnit.SECONDS)
            ));

        } else if (task.getStage() == EscalationTaskDocument.EscalationStage.NO_RESPONSE_120S) {
            log.info("[EscalationService] Dispatching 120s VISITOR_NO_RESPONSE alert to guards for requestId={}", request.getId());
            notificationService.dispatch(new NotificationEvent(
                    request.getSocietyId(),
                    0L,
                    null,
                    request.getFlatNumber(),
                    NotificationDocument.NotificationType.VISITOR_NO_RESPONSE,
                    NotificationDocument.NotificationPriority.HIGH,
                    "⚠️ No Response from Flat " + request.getFlatNumber(),
                    "No response after 120s for visitor " + request.getVisitorName() + ". Option to call resident or hold at gate.",
                    payload,
                    "no_response_120s_" + request.getId(),
                    Instant.now().plus(300, ChronoUnit.SECONDS)
            ));

        } else if (task.getStage() == EscalationTaskDocument.EscalationStage.EXPIRE_TIMEOUT) {
            log.info("[EscalationService] Expiring stale visitor request id={}", request.getId());
            request.setStatus(VisitorStatus.EXPIRED);
            visitorRequestRepository.save(request);

            messagingTemplate.convertAndSend("/topic/society/" + request.getSocietyId() + "/guards", request);
            messagingTemplate.convertAndSend("/topic/society/" + request.getSocietyId() + "/flat/" + request.getFlatNumber(), request);
        }
    }
}
