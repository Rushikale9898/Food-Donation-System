package com.fooddonation.dto.response;

import java.time.LocalDateTime;

import com.fooddonation.enums.FoodType;
import com.fooddonation.enums.QuantityUnit;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectDonationResponse {

	private Long id;
	private Long donorId;
	private String donorName;
	private String donorEmail;
	private String donorPhone;
	private String donorCity;
	private String donorProfileImage;
	private Long receiverId;
	private String receiverName;
	private String receiverEmail;     // ← NEW: receiver email
    private String receiverPhone;     // ← NEW: receiver phone
    private String receiverCity;      // ← NEW: receiver city
    private String receiverAddress;   // ← NEW: receiver address
    private String receiverType;      // ← NEW: INDIVIDUAL | FAMILY | ORPHANAGE etc.
    private Integer receiverFamilySize; // ← NEW: number of people
    private String receiverSpecialNeeds; // ← NEW: dietary restrictions
    private String receiverProfileImage; // ← NEW: receiver avatar
    private Boolean receiverVerified;
	private String title;
	private String description;
	private FoodType foodType;
	private Integer quantity;
	private QuantityUnit quantityUnit;
	private String pickupAddress;
	private String pickupCity;
	private String contactPhone;
	private String preferredTime;
	private LocalDateTime expiresAt;
	private String status;
	private String receiverNote;
	private LocalDateTime completedAt;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
	private Long unreadMessages;

}
