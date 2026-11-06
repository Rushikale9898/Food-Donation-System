package com.fooddonation.entity;

import com.fooddonation.enums.ReceiverType;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "receiver_profiles", uniqueConstraints = @UniqueConstraint(name = "uk_receiver_user", columnNames = "user_id"))
public class ReceiverProfile extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(name = "receiver_type", nullable = false, length = 20)
	@Builder.Default
	private ReceiverType receiverType = ReceiverType.INDIVIDUAL;

	@Column(name = "family_size")
	private Integer familySize;

	@Column(name = "special_needs", length = 500)
	private String specialNeeds; // dietary restrictions, allergies

	@Column(name = "id_proof_type", length = 50)
	private String idProofType; // Aadhaar, Ration Card, etc.

	@Column(name = "id_proof_number", length = 100)
	private String idProofNumber;

	@Column(name = "total_received")
	@Builder.Default
	private Integer totalReceived = 0;

	@Column(name = "is_verified")
	@Builder.Default
	private Boolean isVerified = false;

}
