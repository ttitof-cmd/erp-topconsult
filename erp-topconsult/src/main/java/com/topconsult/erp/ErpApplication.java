package com.topconsult.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ErpApplication {
    public static void main(String[] args) {
        // En un servidor (variable de entorno HEADLESS=true) no se usa interfaz grafica.
        // En una PC de escritorio queda en false para poder abrir el navegador y la bandeja.
        boolean headless = "true".equalsIgnoreCase(System.getenv("HEADLESS"));
        System.setProperty("java.awt.headless", String.valueOf(headless));
        SpringApplication app = new SpringApplication(ErpApplication.class);
        app.setHeadless(headless);
        app.run(args);
    }
}
