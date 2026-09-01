package com.topconsult.erp;

import java.awt.Desktop;
import java.net.URI;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Abre el navegador en http://localhost:<puerto> automaticamente cuando el
 * servidor termina de arrancar. Asi el usuario solo hace doble clic al ejecutable.
 */
@Component
public class BrowserLauncher {

    private final Environment env;

    public BrowserLauncher(Environment env) {
        this.env = env;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void abrirNavegador() {
        // En un servidor (sin pantalla) no se abre navegador
        if (java.awt.GraphicsEnvironment.isHeadless()) return;
        String url = "http://localhost:" + env.getProperty("server.port", "8080");
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI(url));
                return;
            }
        } catch (Exception ignored) { }
        try {
            new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url).start();
        } catch (Exception ignored) { }
    }
}
