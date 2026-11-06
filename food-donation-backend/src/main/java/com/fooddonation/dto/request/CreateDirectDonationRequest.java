package com.fooddonation.dto.request;

import java.time.LocalDateTime;

import com.fooddonation.enums.FoodType;
import com.fooddonation.enums.QuantityUnit;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDirectDonationRequest {

	@NotBlank(message = "Title is required")
	@Size(min = 3, max = 200, message = "Title must be 3-200 characters")
	private String title;

	private String description;

	@NotNull(message = "Food type is required")
	private FoodType foodType;

	@NotNull(message = "Quantity is required")
	@Min(value = 1, message = "Quantity must be at least 1")
	private Integer quantity;

	private QuantityUnit quantityUnit;

	@NotBlank(message = "Pickup address is required")
	private String pickupAddress;

	@NotBlank(message = "City is required")
	private String pickupCity;

	@NotBlank(message = "Contact phone is required")
	@Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit phone number")
	private String contactPhone;

	private String preferredTime;

	@Future(message = "Expiry must be a future date/time")
	private LocalDateTime expiresAt;

}
