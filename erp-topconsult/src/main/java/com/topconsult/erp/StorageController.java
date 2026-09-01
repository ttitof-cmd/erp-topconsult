package com.topconsult.erp;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * API que replica la interfaz window.storage usada por el frontend:
 *   GET    /api/storage/{clave}        -> { key, value, shared } | 404
 *   PUT    /api/storage/{clave}  body { value } -> { key, value, shared }
 *   DELETE /api/storage/{clave}        -> { key, deleted, shared }
 *   GET    /api/storage?prefix=...     -> { keys, prefix, shared }
 */
@RestController
@RequestMapping("/api/storage")
public class StorageController {

    private final KvRepository repo;

    public StorageController(KvRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/{key}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable String key) {
        return repo.findById(key)
                .map(e -> ResponseEntity.ok(payload(e.getK(), e.getV())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{key}")
    public Map<String, Object> set(@PathVariable String key, @RequestBody Map<String, Object> body) {
        Object raw = body == null ? null : body.get("value");
        String value = raw == null ? "" : raw.toString();
        repo.save(new KvEntry(key, value));
        return payload(key, value);
    }

    @DeleteMapping("/{key}")
    public Map<String, Object> delete(@PathVariable String key) {
        if (repo.existsById(key)) {
            repo.deleteById(key);
        }
        Map<String, Object> m = new HashMap<>();
        m.put("key", key);
        m.put("deleted", true);
        m.put("shared", false);
        return m;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam(required = false, defaultValue = "") String prefix) {
        List<String> keys = repo.findByKStartingWith(prefix).stream().map(KvEntry::getK).toList();
        Map<String, Object> m = new HashMap<>();
        m.put("keys", keys);
        m.put("prefix", prefix);
        m.put("shared", false);
        return m;
    }

    private Map<String, Object> payload(String key, String value) {
        Map<String, Object> m = new HashMap<>();
        m.put("key", key);
        m.put("value", value == null ? "" : value);
        m.put("shared", false);
        return m;
    }
}
