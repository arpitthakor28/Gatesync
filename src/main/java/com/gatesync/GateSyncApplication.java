package com.gatesync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GateSyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(GateSyncApplication.class, args);
        System.out.println("\n=======================================================");
        System.out.println(" GateSync Java Fullstack System is live at: http://localhost:8080");
        System.out.println("=======================================================\n");
    }
}
