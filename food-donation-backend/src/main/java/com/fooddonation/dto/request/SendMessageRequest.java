package com.fooddonation.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {

	@NotNull(message = "Donation ID is required")
	private Long donationId;

	@NotBlank(message = "Message cannot be empty")
	@Size(max = 1000, message = "Message to long(max 1000 characters)")
	private String message;

}
