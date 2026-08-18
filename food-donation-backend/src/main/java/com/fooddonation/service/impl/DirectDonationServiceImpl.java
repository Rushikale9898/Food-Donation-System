package com.fooddonation.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fooddonation.dto.request.*;
import com.fooddonation.dto.response.*;
import com.fooddonation.entity.*;
import com.fooddonation.enums.*;
import com.fooddonation.exception.*;
import com.fooddonation.repository.*;
import com.fooddonation.service.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DirectDonationServiceImpl implements DirectDonationService {

	private final DirectDonationRepository directDonationRepository;
	private final DirectMessageRepository messageRepository;
	private final UserRepository userRepository;
	private final ReceiverProfileRepository receiverProfileRepository;
	private final NotificationService notificationService;

	// ─── CREATE ───────────────────────────────────────────────
	@Override
	@Transactional
	public DirectDonationResponse createDirectDonation(String donorEmail, CreateDirectDonationRequest req) {

		User donor = getUserByEmail(donorEmail);

		FoodType foodType = req.getFoodType() != null ? req.getFoodType() : FoodType.VEG;
		QuantityUnit quantityUnit = req.getQuantityUnit() != null ? req.getQuantityUnit() : QuantityUnit.SERVINGS;

		DirectDonation donation = DirectDonation.builder().donor(donor).title(req.getTitle().trim())
				.description(req.getDescription()).foodType(foodType).quantity(req.getQuantity())
				.quantityUnit(quantityUnit).pickupAddress(req.getPickupAddress()).pickupCity(req.getPickupCity())
				.contactPhone(req.getContactPhone()).preferredTime(req.getPreferredTime())
				.expiresAt(req.getExpiresAt() != null ? req.getExpiresAt() : LocalDateTime.now().plusHours(24))
				.status(DirectDonationStatus.AVAILABLE).build();

		DirectDonation saved = directDonationRepository.save(donation);
		log.info("Direct donation #{} created by donor: {}", saved.getId(), donorEmail);
		return mapToResponse(saved, donor.getId(), true);
	}

	// ─── UPDATE ───────────────────────────────────────────────
	@Override
	@Transactional
	public DirectDonationResponse updateDirectDonation(Long id, String donorEmail, CreateDirectDonationRequest req) {

		DirectDonation donation = getAndVerifyDonor(id, donorEmail);
		if (donation.getStatus() != DirectDonationStatus.AVAILABLE)
			throw new BadRequestException("Only AVAILABLE donations can be edited.");

		if (req.getTitle() != null)
			donation.setTitle(req.getTitle().trim());
		if (req.getDescription() != null)
			donation.setDescription(req.getDescription());
		if (req.getFoodType() != null)
			donation.setFoodType(req.getFoodType());
		if (req.getQuantity() != null)
			donation.setQuantity(req.getQuantity());
		if (req.getQuantityUnit() != null)
			donation.setQuantityUnit(req.getQuantityUnit());
		if (req.getPickupAddress() != null)
			donation.setPickupAddress(req.getPickupAddress());
		if (req.getPickupCity() != null)
			donation.setPickupCity(req.getPickupCity());
		if (req.getContactPhone() != null)
			donation.setContactPhone(req.getContactPhone());
		if (req.getPreferredTime() != null)
			donation.setPreferredTime(req.getPreferredTime());
		if (req.getExpiresAt() != null)
			donation.setExpiresAt(req.getExpiresAt());

		User donor = getUserByEmail(donorEmail);
		return mapToResponse(directDonationRepository.save(donation), donor.getId(), true);
	}

	// ─── CANCEL ───────────────────────────────────────────────
	@Override
	@Transactional
	public void cancelDirectDonation(Long id, String donorEmail, String reason) {
		DirectDonation donation = getAndVerifyDonor(id, donorEmail);
		if (donation.getStatus() == DirectDonationStatus.COMPLETED)
			throw new BadRequestException("Completed donations cannot be cancelled.");

		donation.setStatus(DirectDonationStatus.CANCELLED);
		donation.setCancelledReason(reason);
		directDonationRepository.save(donation);

		if (donation.getReceiver() != null) {
			notificationService.sendNotification(
					donation.getReceiver(), "Donation Cancelled", "The direct donation '" + donation.getTitle()
							+ "' from " + donation.getDonor().getFullName() + " has been cancelled. Reason: " + reason,
					NotificationType.ALERT, id, "DIRECT_DONATION");
		}
		log.info("Direct donation #{} cancelled by: {}", id, donorEmail);
	}

	// ─── MARK COMPLETED ───────────────────────────────────────
	@Override
	@Transactional
	public DirectDonationResponse markCompleted(Long id, String donorEmail) {
		DirectDonation donation = getAndVerifyDonor(id, donorEmail);
		if (donation.getStatus() != DirectDonationStatus.ACCEPTED)
			throw new BadRequestException("Only ACCEPTED donations can be marked as completed.");

		donation.setStatus(DirectDonationStatus.COMPLETED);
		donation.setCompletedAt(LocalDateTime.now());
		DirectDonation saved = directDonationRepository.save(donation);

		if (donation.getReceiver() != null) {
			notificationService.sendNotification(donation.getReceiver(), "Donation Completed ✅",
					"The donation '" + donation.getTitle() + "' has been marked as completed. Thank you!",
					NotificationType.DONATION, id, "DIRECT_DONATION");
		}
		User donor = getUserByEmail(donorEmail);
		return mapToResponse(saved, donor.getId(), true);
	}

	// ─── DONOR: get own donations ─────────────────────────────
	@Override
	@Transactional(readOnly = true)
	public PageResponse<DirectDonationResponse> getDonorDonations(String donorEmail, String status, Pageable pageable) {

		User donor = getUserByEmail(donorEmail);
		Page<DirectDonation> page = (status != null && !status.isBlank())
				? directDonationRepository.findByDonorIdAndStatus(donor.getId(),
						DirectDonationStatus.valueOf(status.toUpperCase()), pageable)
				: directDonationRepository.findByDonorId(donor.getId(), pageable);
		return PageResponse.from(page.map(d -> mapToResponse(d, donor.getId(), true)));
	}

	// ─── RECEIVER: browse available ───────────────────────────
	@Override
	@Transactional(readOnly = true)
	public PageResponse<DirectDonationResponse> browseAvailableDonations(String city, String query, Pageable pageable) {

		Page<DirectDonation> page = directDonationRepository.searchAvailable(
				(city != null && !city.isBlank()) ? city : null, (query != null && !query.isBlank()) ? query : null,
				pageable);
		return PageResponse.from(page.map(d -> mapToResponse(d, null, false)));
	}

	// ─── RECEIVER: accept donation ────────────────────────────
	@Override
	@Transactional
	public DirectDonationResponse acceptDonation(Long id, String receiverEmail, String note) {

		DirectDonation donation = directDonationRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Donation", id));
		User receiver = getUserByEmail(receiverEmail);

		if (donation.getStatus() != DirectDonationStatus.AVAILABLE)
			throw new BadRequestException("This donation is no longer available.");
		if (donation.getDonor().getId().equals(receiver.getId()))
			throw new BadRequestException("You cannot accept your own donation.");

		donation.setReceiver(receiver);
		donation.setReceiverNote(note);
		donation.setStatus(DirectDonationStatus.ACCEPTED);
		DirectDonation saved = directDonationRepository.save(donation);

		// ── Build rich receiver info for donor notification ───
		String receiverPhone = receiver.getPhone() != null ? receiver.getPhone() : "Not provided";
		String receiverCity = receiver.getCity() != null ? receiver.getCity() : "";
		String receiverAddress = receiver.getAddress() != null ? receiver.getAddress() : "";

		// Get receiver profile for extra details
		String profileInfo = "";
		var profileOpt = receiverProfileRepository.findByUserId(receiver.getId());
		if (profileOpt.isPresent()) {
			var profile = profileOpt.get();
			if (profile.getFamilySize() != null)
				profileInfo += profile.getFamilySize() + " people";
			if (profile.getSpecialNeeds() != null && !profile.getSpecialNeeds().isBlank())
				profileInfo += (profileInfo.isEmpty() ? "" : " · ") + profile.getSpecialNeeds();
		}

		// ── Notify DONOR with receiver's complete contact ─────
		String donorMsg = receiver.getFullName() + " has accepted your donation '" + donation.getTitle() + "'!\n\n"
				+ "📞 Phone: " + receiverPhone + "\n" + "📍 Location: "
				+ (receiverCity.isBlank() ? "Not provided" : receiverCity)
				+ (receiverAddress.isBlank() ? "" : ", " + receiverAddress)
				+ (profileInfo.isBlank() ? "" : "\n👥 " + profileInfo)
				+ "\n\nGo to your donation details to view full contact info and chat.";

		notificationService.sendNotification(donation.getDonor(),
				"🎉 Donation Accepted — Receiver Contact: " + receiverPhone, donorMsg, NotificationType.DONATION, id,
				"DIRECT_DONATION");

		// ── Notify RECEIVER with donor's contact ──────────────
		String receiverMsg = "You accepted '" + donation.getTitle() + "' from " + donation.getDonor().getFullName()
				+ ".\n\n" + "📞 Donor Phone: " + donation.getContactPhone()
				+ (donation.getPreferredTime() != null ? "\n⏰ Preferred pickup: " + donation.getPreferredTime() : "")
				+ "\n📍 Pickup: " + donation.getPickupAddress() + "\n\nContact the donor to arrange food pickup.";

		notificationService.sendNotification(receiver,
				"Donation Accepted ✅ — Donor Contact: " + donation.getContactPhone(), receiverMsg,
				NotificationType.DONATION, id, "DIRECT_DONATION");

		log.info("Direct donation #{} accepted by receiver: {} — donor notified with receiver phone: {}", id,
				receiverEmail, receiverPhone);

		return mapToResponse(saved, receiver.getId(), false);
	}

	// ─── RECEIVER: get received donations ─────────────────────
	@Override
	@Transactional(readOnly = true)
	public PageResponse<DirectDonationResponse> getReceiverDonations(String receiverEmail, String status,
			Pageable pageable) {

		User receiver = getUserByEmail(receiverEmail);
		Page<DirectDonation> page = (status != null && !status.isBlank())
				? directDonationRepository.findByReceiverIdAndStatus(receiver.getId(),
						DirectDonationStatus.valueOf(status.toUpperCase()), pageable)
				: directDonationRepository.findByReceiverId(receiver.getId(), pageable);
		return PageResponse.from(page.map(d -> mapToResponse(d, receiver.getId(), false)));
	}

	// ─── GET BY ID ────────────────────────────────────────────
	@Override
	@Transactional(readOnly = true)
	public DirectDonationResponse getById(Long id, String userEmail) {
		User user = getUserByEmail(userEmail);
		DirectDonation donation = directDonationRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Donation", id));
		boolean isDonor = donation.getDonor().getId().equals(user.getId());
		return mapToResponse(donation, user.getId(), isDonor);
	}

	// ─── SEND MESSAGE ─────────────────────────────────────────
	@Override
	@Transactional
	public DirectMessageResponse sendMessage(String senderEmail, SendMessageRequest req) {
		User sender = getUserByEmail(senderEmail);
		DirectDonation donation = directDonationRepository.findById(req.getDonationId())
				.orElseThrow(() -> new ResourceNotFoundException("Donation", req.getDonationId()));

		boolean isDonor = donation.getDonor().getId().equals(sender.getId());
		boolean isReceiver = donation.getReceiver() != null && donation.getReceiver().getId().equals(sender.getId());

		if (!isDonor && !isReceiver)
			throw new UnauthorizedException("You are not a participant in this donation.");

		User msgReceiver = isDonor ? donation.getReceiver() : donation.getDonor();
		if (msgReceiver == null)
			throw new BadRequestException("No receiver has accepted this donation yet.");

		DirectMessage message = DirectMessage.builder().donation(donation).sender(sender).receiver(msgReceiver)
				.message(req.getMessage().trim()).build();
		DirectMessage saved = messageRepository.save(message);

		String preview = req.getMessage().length() > 80 ? req.getMessage().substring(0, 80) + "…" : req.getMessage();
		notificationService.sendNotification(msgReceiver, "New message from " + sender.getFullName(), preview,
				NotificationType.SYSTEM, donation.getId(), "DIRECT_MESSAGE");

		return mapMessageToResponse(saved, sender.getId());
	}

	// ─── GET CONVERSATION ─────────────────────────────────────
	@Override
	@Transactional
	public List<DirectMessageResponse> getConversation(Long donationId, String userEmail) {
		User user = getUserByEmail(userEmail);
		DirectDonation donation = directDonationRepository.findById(donationId)
				.orElseThrow(() -> new ResourceNotFoundException("Donation", donationId));

		boolean isDonor = donation.getDonor().getId().equals(user.getId());
		boolean isReceiver = donation.getReceiver() != null && donation.getReceiver().getId().equals(user.getId());
		if (!isDonor && !isReceiver)
			throw new UnauthorizedException("Access denied");

		messageRepository.markConversationAsRead(donationId, user.getId());
		return messageRepository.findByDonationIdOrderByCreatedAtAsc(donationId).stream()
				.map(m -> mapMessageToResponse(m, user.getId())).toList();
	}

	// ─── MARK CONVERSATION READ ───────────────────────────────
	@Override
	@Transactional
	public void markConversationRead(Long donationId, String userEmail) {
		User user = getUserByEmail(userEmail);
		messageRepository.markConversationAsRead(donationId, user.getId());
	}

	// ─── UNREAD COUNT ─────────────────────────────────────────
	@Override
	@Transactional(readOnly = true)
	public long getUnreadMessageCount(String userEmail) {
		User user = getUserByEmail(userEmail);
		return messageRepository.countUnreadByReceiverId(user.getId());
	}

	// ─── SCHEDULED EXPIRY ─────────────────────────────────────
	@Scheduled(fixedRate = 3600000)
	@Transactional
	public void expireOldDonations() {
		List<DirectDonation> expired = directDonationRepository.findExpired(LocalDateTime.now());
		expired.forEach(d -> {
			d.setStatus(DirectDonationStatus.EXPIRED);
			log.info("Direct donation #{} expired", d.getId());
		});
		if (!expired.isEmpty())
			directDonationRepository.saveAll(expired);
	}

	// ─── PRIVATE HELPERS ──────────────────────────────────────

	private DirectDonation getAndVerifyDonor(Long id, String donorEmail) {
		User donor = getUserByEmail(donorEmail);
		DirectDonation donation = directDonationRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Donation", id));
		if (!donation.getDonor().getId().equals(donor.getId()))
			throw new UnauthorizedException("You can only modify your own donations.");
		return donation;
	}

	private User getUserByEmail(String email) {
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
	}

	/**
	 * @param includeReceiverContact true = DONOR viewing → receiver
	 *                               phone/email/address exposed false = public
	 *                               browse or receiver viewing → contact hidden
	 */
	private DirectDonationResponse mapToResponse(DirectDonation d, Long currentUserId, boolean includeReceiverContact) {

		long unread = 0;
		if (currentUserId != null) {
			try {
				unread = messageRepository.countUnreadInDonation(d.getId(), currentUserId);
			} catch (Exception ignored) {
			}
		}

		DirectDonationResponse.DirectDonationResponseBuilder builder = DirectDonationResponse.builder().id(d.getId())
				.title(d.getTitle()).description(d.getDescription()).foodType(d.getFoodType()).quantity(d.getQuantity())
				.quantityUnit(d.getQuantityUnit()).pickupAddress(d.getPickupAddress()).pickupCity(d.getPickupCity())
				.contactPhone(d.getContactPhone()).preferredTime(d.getPreferredTime()).expiresAt(d.getExpiresAt())
				.status(d.getStatus() != null ? d.getStatus().name() : null).receiverNote(d.getReceiverNote())
				.completedAt(d.getCompletedAt()).createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt())
				.unreadMessages(unread).donorId(d.getDonor().getId()).donorName(d.getDonor().getFullName())
				.donorEmail(d.getDonor().getEmail()).donorPhone(d.getContactPhone()).donorCity(d.getPickupCity())
				.donorProfileImage(d.getDonor().getProfileImage());

		// Receiver info
		if (d.getReceiver() != null) {
			User rx = d.getReceiver();

			// Basic info always included
			builder.receiverId(rx.getId()).receiverName(rx.getFullName()).receiverProfileImage(rx.getProfileImage());

			// Full contact only for DONOR
			if (includeReceiverContact) {
				builder.receiverEmail(rx.getEmail()).receiverPhone(rx.getPhone()).receiverCity(rx.getCity())
						.receiverAddress(rx.getAddress());

				receiverProfileRepository.findByUserId(rx.getId()).ifPresent(profile -> builder
						.receiverType(profile.getReceiverType() != null ? profile.getReceiverType().name() : null)
						.receiverFamilySize(profile.getFamilySize()).receiverSpecialNeeds(profile.getSpecialNeeds())
						.receiverVerified(profile.getIsVerified()));
			}
		}

		return builder.build();
	}

	private DirectMessageResponse mapMessageToResponse(DirectMessage m, Long currentUserId) {
		return DirectMessageResponse.builder().id(m.getId()).donationId(m.getDonation().getId())
				.senderId(m.getSender().getId()).senderName(m.getSender().getFullName())
				.senderProfileImage(m.getSender().getProfileImage()).receiverId(m.getReceiver().getId())
				.receiverName(m.getReceiver().getFullName()).message(m.getMessage()).isRead(m.getIsRead())
				.readAt(m.getReadAt()).createdAt(m.getCreatedAt()).isMine(m.getSender().getId().equals(currentUserId))
				.build();
	}

}
