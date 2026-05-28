package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByActiveTrueOrderByCreatedAtDesc();
    List<Store> findAllByOrderByCreatedAtDesc();
    Optional<Store> findBySlugIgnoreCase(String slug);
    boolean existsBySlugIgnoreCase(String slug);
}
