package com.topconsult.erp;

import java.awt.Image;
import java.awt.MenuItem;
import java.awt.PopupMenu;
import java.awt.SystemTray;
import java.awt.TrayIcon;
import java.awt.Toolkit;
import java.awt.Desktop;
import java.net.URI;

import javax.imageio.ImageIO;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Coloca un icono de TopConsult junto al reloj (bandeja del sistema).
 * Con doble clic abre el sistema en el navegador y con "Salir" apaga
 * el servidor por completo (para que no quede corriendo por detras).
 */
@Component
public class SystemTrayLauncher {

    private final Environment env;
    private final ApplicationContext context;

    public SystemTrayLauncher(Environment env, ApplicationContext context) {
        this.env = env;
        this.context = context;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void iniciarBandeja() {
        final String url = "http://localhost:" + env.getProperty("server.port", "8080");

        // En un servidor (sin pantalla) no se crea la bandeja
        try {
            if (java.awt.GraphicsEnvironment.isHeadless() || !SystemTray.isSupported()) return;
        } catch (Throwable t) {
            return;
        }

        try {
            Image icon;
            try {
                icon = ImageIO.read(getClass().getResourceAsStream("/tray-icon.png"));
            } catch (Exception e) {
                icon = Toolkit.getDefaultToolkit().createImage(new byte[0]);
            }

            PopupMenu menu = new PopupMenu();

            MenuItem abrir = new MenuItem("Abrir TopConsult");
            abrir.addActionListener(e -> abrirNavegador(url));
            menu.add(abrir);

            menu.addSeparator();

            MenuItem salir = new MenuItem("Salir (apagar el sistema)");
            salir.addActionListener(e -> {
                try {
                    SystemTray tray = SystemTray.getSystemTray();
                    for (TrayIcon ti : tray.getTrayIcons()) {
                        tray.remove(ti);
                    }
                } catch (Exception ignored) { }
                int code = org.springframework.boot.SpringApplication.exit(context, () -> 0);
                System.exit(code);
            });
            menu.add(salir);

            TrayIcon trayIcon = new TrayIcon(icon, "TopConsult - sistema en ejecucion", menu);
            trayIcon.setImageAutoSize(true);
            trayIcon.addActionListener(e -> abrirNavegador(url)); // doble clic
            trayIcon.displayMessage("TopConsult",
                    "El sistema esta corriendo. Clic derecho aqui para salir.",
                    TrayIcon.MessageType.INFO);

            SystemTray.getSystemTray().add(trayIcon);
        } catch (Exception ex) {
            // Si falla la bandeja, el sistema sigue funcionando igual
            System.out.println("No se pudo crear el icono de bandeja: " + ex.getMessage());
        }
    }

    private void abrirNavegador(String url) {
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
