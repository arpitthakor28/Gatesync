package com.gatesync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.gatesync.repository.jpa")
@EnableMongoRepositories(basePackages = "com.gatesync.repository.mongo")
public class GateSyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(GateSyncApplication.class, args);
        System.out.println("\n=======================================================");
        System.out.println(" GateSync Java Fullstack System is live at: http://localhost:8080");
        System.out.println("=======================================================\n");
    }
}
