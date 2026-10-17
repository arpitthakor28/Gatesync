package com.societysync.controller;

import com.societysync.dto.AnnouncementCreateDto;
import com.societysync.entity.Announcement;
import com.societysync.service.AnnouncementService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Stand-in for the PHP app's Event Calendar / Neighbourhood modules - basic CRUD only.
// TODO: split into dated Events + threaded Neighbourhood posts if you want those back at full depth.
@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @PostMapping
    public Announcement create(@RequestBody AnnouncementCreateDto dto, Authentication auth) {
        return announcementService.create(dto, auth.getName());
    }

    @GetMapping
    public List<Announcement> all() {
        return announcementService.all();
    }
}
