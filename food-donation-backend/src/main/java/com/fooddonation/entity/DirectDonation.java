package com.fooddonation.entity;

import java.time.LocalDateTime;

import com.fooddonation.enums.DirectDonationStatus;
import com.fooddonation.enums.FoodType;
import com.fooddonation.enums.QuantityUnit;

import jakarta.persistence.*;
import lombok.*;

/**
 * Donor directly donates a small amount of food to a specific Receiver. No NGO
 * or delivery agent involved — they contact each other directly.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "direct_donations", indexes = { @Index(name = "idx_dd_donor", columnList = "donor_id"),
		@Index(name = "idx_dd_receiver", columnList = "receiver_id"),
		@Index(name = "idx_dd_status", columnList = "status"), })
public class DirectDonation extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "donor_id", nullable = false)
	private User donor;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "receiver_id", nullable = true)
	private User receiver;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(name = "food_type", nullable = false, length = 10)
	@Builder.Default
	private FoodType foodType = FoodType.VEG;

	@Column(nullable = false)
	private Integer quantity;

	@Enumerated(EnumType.STRING)
	@Column(name = "quantity_unit", length = 10)
	@Builder.Default
	private QuantityUnit quantityUnit = QuantityUnit.SERVINGS;

	@Column(name = "pickup_address", columnDefinition = "TEXT")
	private String pickupAddress;

	@Column(name = "pickup_city", length = 100)
	private String pickupCity;

	@Column(name = "contact_phone", length = 15)
	private String contactPhone; // donor shares phone for direct contact

	@Column(name = "preferred_time", length = 100)
	private String preferredTime; // e.g. "Between 2PM - 5PM"

	@Column(name = "expires_at")
	private LocalDateTime expiresAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	@Builder.Default
	private DirectDonationStatus status = DirectDonationStatus.AVAILABLE;

	@Column(name = "receiver_note", columnDefinition = "TEXT")
	private String receiverNote; // receiver's note when accepting

	@Column(name = "completed_at")
	private LocalDateTime completedAt;

	@Column(name = "cancelled_reason", columnDefinition = "TEXT")
	private String cancelledReason;

}
