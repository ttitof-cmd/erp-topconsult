package com.topconsult.erp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Almacen clave-valor. Cada registro del ERP (todos los datos bajo una clave,
 * y cada archivo bajo su propia clave) se guarda aqui como texto/JSON.
 */
@Entity
@Table(name = "kv_store")
public class KvEntry {

    @Id
    @Column(name = "k", length = 250)
    private String k;

    @Column(name = "v", columnDefinition = "text")
    private String v;

    public KvEntry() {
    }

    public KvEntry(String k, String v) {
        this.k = k;
        this.v = v;
    }

    public String getK() {
        return k;
    }

    public void setK(String k) {
        this.k = k;
    }

    public String getV() {
        return v;
    }

    public void setV(String v) {
        this.v = v;
    }
}
