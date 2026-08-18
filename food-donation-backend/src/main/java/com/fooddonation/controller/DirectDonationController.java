package com.fooddonation.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.fooddonation.dto.request.*;
import com.fooddonation.dto.response.*;
import com.fooddonation.service.DirectDonationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/direct-donations")
@RequiredArgsConstructor
@Tag(name = "Direct Donations", description = "Donor → Receiver direct donation and messaging")
public class DirectDonationController {

	private final DirectDonationService directDonationService;

	// ─────────────────────────────────────────────────────────
	// DONOR ENDPOINTS
	// ─────────────────────────────────────────────────────────

	@PostMapping
	@Operation(summary = "Donor — Create a direct donation for a receiver")
	public ResponseEntity<ApiResponse<DirectDonationResponse>> create(Authentication auth,
			@Valid @RequestBody CreateDirectDonationRequest request) {
		return ResponseEntity.ok(ApiResponse.success("Direct donation created!",
				directDonationService.createDirectDonation(auth.getName(), request)));
	}

	@PutMapping("/{id}")
	@Operation(summary = "Donor — Edit a direct donation (only if still AVAILABLE)")
	public ResponseEntity<ApiResponse<DirectDonationResponse>> update(Authentication auth, @PathVariable Long id,
			@Valid @RequestBody CreateDirectDonationRequest request) {
		return ResponseEntity.ok(ApiResponse.success("Donation updated",
				directDonationService.updateDirectDonation(id, auth.getName(), request)));
	}

	@PutMapping("/{id}/cancel")
	@Operation(summary = "Donor — Cancel a direct donation")
	public ResponseEntity<ApiResponse<Void>> cancel(Authentication auth, @PathVariable Long id,
			@RequestBody(required = false) Map<String, String> body) {
		String reason = body != null ? body.getOrDefault("reason", "Cancelled by donor") : "Cancelled";
		directDonationService.cancelDirectDonation(id, auth.getName(), reason);
		return ResponseEntity.ok(ApiResponse.success("Donation cancelled", null));
	}

	@PutMapping("/{id}/complete")
	@Operation(summary = "Donor — Mark donation as completed after handover")
	public ResponseEntity<ApiResponse<DirectDonationResponse>> complete(Authentication auth, @PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.success("Donation marked as completed!",
				directDonationService.markCompleted(id, auth.getName())));
	}

	@GetMapping("/my-donations")
	@Operation(summary = "Donor — Get own direct donations")
	public ResponseEntity<ApiResponse<PageResponse<DirectDonationResponse>>> myDonations(Authentication auth,
			@RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size) {
		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
		return ResponseEntity
				.ok(ApiResponse.success(directDonationService.getDonorDonations(auth.getName(), status, pageable)));
	}

	// ─────────────────────────────────────────────────────────
	// RECEIVER ENDPOINTS
	// ─────────────────────────────────────────────────────────

	@GetMapping("/browse")
	@Operation(summary = "Receiver — Browse available direct donations")
	public ResponseEntity<ApiResponse<PageResponse<DirectDonationResponse>>> browse(
			@RequestParam(required = false) String city, @RequestParam(required = false) String q,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
		return ResponseEntity
				.ok(ApiResponse.success(directDonationService.browseAvailableDonations(city, q, pageable)));
	}

	@PostMapping("/{id}/accept")
	@Operation(summary = "Receiver — Accept a direct donation")
	public ResponseEntity<ApiResponse<DirectDonationResponse>> accept(Authentication auth, @PathVariable Long id,
			@RequestBody(required = false) Map<String, String> body) {
		String note = body != null ? body.getOrDefault("note", "") : "";
		return ResponseEntity.ok(ApiResponse.success("Donation accepted! You can now message the donor.",
				directDonationService.acceptDonation(id, auth.getName(), note)));
	}

	@GetMapping("/my-received")
	@Operation(summary = "Receiver — Get own accepted/received donations")
	public ResponseEntity<ApiResponse<PageResponse<DirectDonationResponse>>> myReceived(Authentication auth,
			@RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size) {
		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
		return ResponseEntity
				.ok(ApiResponse.success(directDonationService.getReceiverDonations(auth.getName(), status, pageable)));
	}

	// ─────────────────────────────────────────────────────────
	// SHARED ENDPOINTS
	// ─────────────────────────────────────────────────────────

	@GetMapping("/{id}")
	@Operation(summary = "Get donation detail by ID")
	public ResponseEntity<ApiResponse<DirectDonationResponse>> getById(Authentication auth, @PathVariable Long id) {
		return ResponseEntity.ok(ApiResponse.success(directDonationService.getById(id, auth.getName())));
	}

	// ─────────────────────────────────────────────────────────
	// MESSAGING ENDPOINTS (Donor ↔ Receiver)
	// ─────────────────────────────────────────────────────────

	@PostMapping("/messages")
	@Operation(summary = "Send a message to the other party (donor or receiver)")
	public ResponseEntity<ApiResponse<DirectMessageResponse>> sendMessage(Authentication auth,
			@Valid @RequestBody SendMessageRequest request) {
		return ResponseEntity
				.ok(ApiResponse.success("Message sent!", directDonationService.sendMessage(auth.getName(), request)));
	}

	@GetMapping("/{donationId}/messages")
	@Operation(summary = "Get full conversation for a donation")
	public ResponseEntity<ApiResponse<List<DirectMessageResponse>>> getConversation(Authentication auth,
			@PathVariable Long donationId) {
		return ResponseEntity
				.ok(ApiResponse.success(directDonationService.getConversation(donationId, auth.getName())));
	}

	@PutMapping("/{donationId}/messages/read")
	@Operation(summary = "Mark all messages in a conversation as read")
	public ResponseEntity<ApiResponse<Void>> markRead(Authentication auth, @PathVariable Long donationId) {
		directDonationService.markConversationRead(donationId, auth.getName());
		return ResponseEntity.ok(ApiResponse.success("Messages marked as read", null));
	}

	@GetMapping("/messages/unread-count")
	@Operation(summary = "Get total unread message count for current user")
	public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount(Authentication auth) {
		long count = directDonationService.getUnreadMessageCount(auth.getName());
		return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
	}

}
