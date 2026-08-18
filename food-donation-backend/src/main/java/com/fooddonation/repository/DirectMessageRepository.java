package com.fooddonation.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fooddonation.entity.DirectMessage;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

	// Get all messages for a donation (conversation thread)
	List<DirectMessage> findByDonationIdOrderByCreatedAtAsc(Long donationId);

	// Unread messages for a user
	@Query("SELECT m FROM DirectMessage m WHERE m.receiver.id = :userId AND m.isRead = false")
	List<DirectMessage> findUnreadByReceiverId(@Param("userId") Long userId);

	// Count unread
	@Query("SELECT COUNT(m) FROM DirectMessage m WHERE m.receiver.id = :userId AND m.isRead = false")
	long countUnreadByReceiverId(@Param("userId") Long userId);

	// Mark all messages in a donation as read for a user
	@Modifying
	@Query("UPDATE DirectMessage m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP "
			+ "WHERE m.donation.id = :donationId AND m.receiver.id = :userId AND m.isRead = false")
	void markConversationAsRead(@Param("donationId") Long donationId, @Param("userId") Long userId);

	// Get all conversations (unique donations) for a user
	@Query("SELECT DISTINCT m.donation FROM DirectMessage m "
			+ "WHERE m.sender.id = :userId OR m.receiver.id = :userId " + "ORDER BY m.donation.createdAt DESC")
	Page<com.fooddonation.entity.DirectDonation> findConversationsByUserId(@Param("userId") Long userId,
			Pageable pageable);

	@Query("SELECT COUNT(m) FROM DirectMessage m WHERE m.donation.id = :donationId AND m.receiver.id = :userId AND m.isRead = false")
	long countUnreadInDonation(@Param("donationId") Long donationId, @Param("userId") Long userId);

}
