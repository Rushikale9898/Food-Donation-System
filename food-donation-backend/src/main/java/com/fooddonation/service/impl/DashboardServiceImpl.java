package com.fooddonation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fooddonation.dto.response.DashboardStatsResponse;
import com.fooddonation.entity.Role;
import com.fooddonation.entity.User;
import com.fooddonation.enums.AssignmentStatus;
import com.fooddonation.enums.ClaimStatus;
import com.fooddonation.enums.DirectDonationStatus;
import com.fooddonation.enums.DonationStatus;
import com.fooddonation.exception.ResourceNotFoundException;
import com.fooddonation.repository.DeliveryAssignmentRepository;
import com.fooddonation.repository.DirectDonationRepository;
import com.fooddonation.repository.FoodDonationRepository;
import com.fooddonation.repository.NgoClaimRepository;
import com.fooddonation.repository.UserRepository;
import com.fooddonation.service.DashboardService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

	private final UserRepository userRepository;
	private final FoodDonationRepository donationRepository;
	private final NgoClaimRepository claimRepository;
	private final DeliveryAssignmentRepository deliveryRepository;
	private final DirectDonationRepository directDonationRepository;

	// ── ADMIN ─────────────────────────────────────────────────
	@Override
	@Transactional(readOnly = true)
	public DashboardStatsResponse getAdminDashboard() {

		int year = LocalDateTime.now().getYear();

		// Monthly chart data
		List<Object[]> monthlyRaw = donationRepository.getMonthlyStats(year);
		List<Map<String, Object>> monthly = new ArrayList<>();
		String[] months = { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
		for (Object[] row : monthlyRaw) {
			Map<String, Object> m = new HashMap<>();
			m.put("month", months[((Number) row[0]).intValue() - 1]);
			m.put("count", row[1]);
			monthly.add(m);
		}

		// By status chart
		List<Map<String, Object>> byStatus = new ArrayList<>();
		for (DonationStatus s : DonationStatus.values()) {
			Map<String, Object> m = new HashMap<>();
			m.put("status", s.name());
			m.put("count", donationRepository.countByStatus(s));
			byStatus.add(m);
		}

		// By city chart
		List<Object[]> cityRaw = donationRepository.getDonationsByCity();
		List<Map<String, Object>> byCity = new ArrayList<>();
		for (Object[] row : cityRaw) {
			Map<String, Object> m = new HashMap<>();
			m.put("city", row[0]);
			m.put("count", row[1]);
			byCity.add(m);
		}

		return DashboardStatsResponse.builder().totalUsers(userRepository.count())
				.totalDonors(userRepository.countByRole(Role.DONOR)).totalNgos(userRepository.countByRole(Role.NGO))
				.totalAgents(userRepository.countByRole(Role.DELIVERY_AGENT))
				.totalReceivers(userRepository.countByRole(Role.RECEIVER)).totalDonations(donationRepository.count())
				.pendingDonations(donationRepository.countByStatus(DonationStatus.PENDING))
				.completedDonations(donationRepository.countByStatus(DonationStatus.DELIVERED))
				.expiredDonations(donationRepository.countByStatus(DonationStatus.EXPIRED))
				.totalDeliveries(deliveryRepository.count())
				.completedDeliveries(deliveryRepository.countByStatus(AssignmentStatus.DELIVERED))
				.pendingClaims(claimRepository.countByStatus(ClaimStatus.PENDING)).monthlyDonations(monthly)
				.donationsByStatus(byStatus).donationsByCity(byCity).build();
	}

	// ── DONOR ─────────────────────────────────────────────────
	@Override
	@Transactional(readOnly = true)
	public DashboardStatsResponse getDonorDashboard(String email) {
		User donor = getUserByEmail(email);

		// Regular donations count
		long myDonations = donationRepository.countByDonorId(donor.getId());

		// Direct donations count (all statuses)
		long myDirectDonations = directDonationRepository.countByDonorId(donor.getId());

		// Combined total = regular + direct
		long totalAll = myDonations + myDirectDonations;

		// Direct donation breakdown by status
		long directAvailable = directDonationRepository.countByDonorIdAndStatus(donor.getId(),
				DirectDonationStatus.AVAILABLE);
		long directAccepted = directDonationRepository.countByDonorIdAndStatus(donor.getId(),
				DirectDonationStatus.ACCEPTED);
		long directCompleted = directDonationRepository.countByDonorIdAndStatus(donor.getId(),
				DirectDonationStatus.COMPLETED);

		// Regular donation breakdown
		long pendingCount = donationRepository.countByDonorIdAndStatus(donor.getId(), DonationStatus.PENDING);
		long approvedCount = donationRepository.countByDonorIdAndStatus(donor.getId(), DonationStatus.APPROVED);
		long deliveredCount = donationRepository.countByDonorIdAndStatus(donor.getId(), DonationStatus.DELIVERED);

		return DashboardStatsResponse.builder().myDonations(myDonations).myDirectDonations(myDirectDonations)
				.totalDonationsAll(totalAll).directAvailable(directAvailable).directAccepted(directAccepted)
				.directCompleted(directCompleted).pendingDonationsCount(pendingCount)
				.approvedDonationsCount(approvedCount).deliveredCount(deliveredCount).build();
	}

	// ── NGO ───────────────────────────────────────────────────
	@Override
	@Transactional(readOnly = true)
	public DashboardStatsResponse getNgoDashboard(String email) {
		User ngo = getUserByEmail(email);

		return DashboardStatsResponse.builder().myClaims(claimRepository.countByNgoId(ngo.getId()))
				.approvedClaims(claimRepository.countByNgoIdAndStatus(ngo.getId(), ClaimStatus.APPROVED))
				.completedClaims(claimRepository.countByNgoIdAndStatus(ngo.getId(), ClaimStatus.COMPLETED))
				.pendingClaimsNgo(claimRepository.countByNgoIdAndStatus(ngo.getId(), ClaimStatus.PENDING)).build();
	}

	// ── AGENT ─────────────────────────────────────────────────
	@Override
	@Transactional(readOnly = true)
	public DashboardStatsResponse getAgentDashboard(String email) {
		User agent = getUserByEmail(email);

		long myDeliveries = deliveryRepository.countByAgentId(agent.getId());

		// Today's deliveries
		LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
		long todayDeliveries = deliveryRepository.countByAgentIdAndDeliveredAtAfter(agent.getId(), startOfDay);

		return DashboardStatsResponse.builder().myDeliveries(myDeliveries)
				.completedDeliveries(
						deliveryRepository.countByAgentIdAndStatus(agent.getId(), AssignmentStatus.DELIVERED))
				.todayDeliveries(todayDeliveries).build();
	}

	// ── RECEIVER ──────────────────────────────────────────────
	@Override
	@Transactional(readOnly = true)
	public DashboardStatsResponse getReceiverDashboard(String email) {
		User receiver = getUserByEmail(email);

		return DashboardStatsResponse.builder().myReceived(directDonationRepository.countByReceiverId(receiver.getId()))
				.receivedAccepted(directDonationRepository.countByReceiverIdAndStatus(receiver.getId(),
						DirectDonationStatus.ACCEPTED))
				.receivedCompleted(directDonationRepository.countByReceiverIdAndStatus(receiver.getId(),
						DirectDonationStatus.COMPLETED))
				.build();
	}

	// ── helper ────────────────────────────────────────────────
	private User getUserByEmail(String email) {
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
	}
}
