package com.fooddonation.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

/**
 * Direct chat message between Donor and Receiver. Linked to a DirectDonation so
 * both parties know the context.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "direct_messages", indexes = { @Index(name = "idx_dm_donation", columnList = "donation_id"),
		@Index(name = "idx_dm_sender", columnList = "sender_id"),
		@Index(name = "idx_dm_receiver", columnList = "receiver_id"),
		@Index(name = "idx_dm_created", columnList = "created_at"), })
public class DirectMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "donation_id", nullable = false)
	private DirectDonation donation;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_id", nullable = false)
	private User sender;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "receiver_id", nullable = false)
	private User receiver;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String message;

	@Column(name = "is_read")
	@Builder.Default
	private Boolean isRead = false;

	@Column(name = "read_at")
	private LocalDateTime readAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
	}

}
