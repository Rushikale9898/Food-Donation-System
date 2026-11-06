package com.fooddonation.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectMessageResponse {

	private Long id;
	private Long donationId;
	private Long senderId;
	private String senderName;
	private String senderProfileImage;
	private Long receiverId;
	private String receiverName;
	private String message;
	private Boolean isRead;
	private LocalDateTime readAt;
	private LocalDateTime createdAt;
	private Boolean isMine; // true if sent by the current user

}
