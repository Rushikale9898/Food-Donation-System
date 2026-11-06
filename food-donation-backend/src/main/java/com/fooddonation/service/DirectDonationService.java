package com.fooddonation.service;

import java.util.List;

import org.springframework.data.domain.Pageable;

import com.fooddonation.dto.request.CreateDirectDonationRequest;
import com.fooddonation.dto.request.SendMessageRequest;
import com.fooddonation.dto.response.DirectDonationResponse;
import com.fooddonation.dto.response.DirectMessageResponse;
import com.fooddonation.dto.response.PageResponse;

public interface DirectDonationService {

	// ─── Donor actions ────────────────────────────────────────
	DirectDonationResponse createDirectDonation(String donorEmail, CreateDirectDonationRequest request);

	DirectDonationResponse updateDirectDonation(Long id, String donorEmail, CreateDirectDonationRequest request);

	void cancelDirectDonation(Long id, String donorEmail, String reason);

	PageResponse<DirectDonationResponse> getDonorDonations(String donorEmail, String status, Pageable pageable);

	DirectDonationResponse markCompleted(Long id, String donorEmail);

	// ─── Receiver actions ─────────────────────────────────────
	PageResponse<DirectDonationResponse> browseAvailableDonations(String city, String query, Pageable pageable);

	DirectDonationResponse acceptDonation(Long id, String receiverEmail, String note);

	PageResponse<DirectDonationResponse> getReceiverDonations(String receiverEmail, String status, Pageable pageable);

	// ─── Shared ───────────────────────────────────────────────
	DirectDonationResponse getById(Long id, String userEmail);

	// ─── Messaging ────────────────────────────────────────────
	DirectMessageResponse sendMessage(String senderEmail, SendMessageRequest request);

	List<DirectMessageResponse> getConversation(Long donationId, String userEmail);

	void markConversationRead(Long donationId, String userEmail);

	long getUnreadMessageCount(String userEmail);

}
