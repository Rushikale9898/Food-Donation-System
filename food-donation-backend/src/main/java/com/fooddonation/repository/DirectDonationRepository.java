package com.fooddonation.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fooddonation.entity.DirectDonation;
import com.fooddonation.enums.DirectDonationStatus;

@Repository
public interface DirectDonationRepository extends JpaRepository<DirectDonation, Long> {

	// ── Pagination queries ────────────────────────────────────
    Page<DirectDonation> findByDonorId(Long donorId, Pageable pageable);
    Page<DirectDonation> findByReceiverId(Long receiverId, Pageable pageable);
    Page<DirectDonation> findByStatus(DirectDonationStatus status, Pageable pageable);
    Page<DirectDonation> findByDonorIdAndStatus(Long donorId, DirectDonationStatus status, Pageable pageable);
    Page<DirectDonation> findByReceiverIdAndStatus(Long receiverId, DirectDonationStatus status, Pageable pageable);

    // ── Count queries for dashboard ───────────────────────────
    long countByDonorId(Long donorId);
    long countByReceiverId(Long receiverId);
    long countByStatus(DirectDonationStatus status);

    // ← needed for donor dashboard breakdown
    long countByDonorIdAndStatus(Long donorId, DirectDonationStatus status);

    // ← needed for receiver dashboard breakdown
    long countByReceiverIdAndStatus(Long receiverId, DirectDonationStatus status);

    // ── Search available ──────────────────────────────────────
    @Query("SELECT d FROM DirectDonation d WHERE d.status = com.fooddonation.enums.DirectDonationStatus.AVAILABLE " +
           "AND (:city IS NULL OR LOWER(d.pickupCity) = LOWER(:city)) " +
           "AND (:q IS NULL OR :q = '' " +
           "     OR LOWER(d.title) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "     OR LOWER(d.description) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<DirectDonation> searchAvailable(
            @Param("city") String city,
            @Param("q") String query,
            Pageable pageable);

    // ── Expired ───────────────────────────────────────────────
    @Query("SELECT d FROM DirectDonation d WHERE d.status = com.fooddonation.enums.DirectDonationStatus.AVAILABLE AND d.expiresAt < :now")
    List<DirectDonation> findExpired(@Param("now") LocalDateTime now);

}
