package com.topconsult.erp;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface KvRepository extends JpaRepository<KvEntry, String> {
    List<KvEntry> findByKStartingWith(String prefix);
}
