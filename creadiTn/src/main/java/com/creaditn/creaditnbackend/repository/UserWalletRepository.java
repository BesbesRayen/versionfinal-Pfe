package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.UserWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserWalletRepository extends JpaRepository<UserWallet, Long> {
    Optional<UserWallet> findByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select wallet from UserWallet wallet where wallet.userId = :userId")
    Optional<UserWallet> findByUserIdForUpdate(@Param("userId") Long userId);
}
