package com.societysync.service;

import com.societysync.dto.AnnouncementCreateDto;
import com.societysync.entity.Announcement;
import com.societysync.repository.AnnouncementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnnouncementService {

    private final AnnouncementRepository repository;

    public AnnouncementService(AnnouncementRepository repository) {
        this.repository = repository;
    }

    public Announcement create(AnnouncementCreateDto dto, String adminLoginId) {
        Announcement a = new Announcement();
        a.setTitle(dto.title());
        a.setContent(dto.content());
        a.setCreatedByLoginId(adminLoginId);
        return repository.save(a);
    }

    public List<Announcement> all() {
        return repository.findAllByOrderByCreatedAtDesc();
    }
}
