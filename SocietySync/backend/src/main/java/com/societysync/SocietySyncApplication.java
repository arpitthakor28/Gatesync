package com.societysync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SocietySyncApplication {
    public static void main(String[] args) {
        SpringApplication.run(SocietySyncApplication.class, args);
    }
}
