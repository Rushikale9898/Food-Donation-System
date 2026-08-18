package com.fooddonation.dto.response;

import java.util.List;
import java.util.Map;

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
public class DashboardStatsResponse {

	// Admin stats
	private Long totalUsers;
    private Long totalDonors;
    private Long totalNgos;
    private Long totalAgents;
    private Long totalReceivers;
    private Long totalDonations;
    private Long pendingDonations;
    private Long completedDonations;
    private Long expiredDonations;
    private Long totalDeliveries;
    private Long completedDeliveries;
    private Long pendingClaims;

	// Donor Stats
    private Long myDonations;          // regular donations
    private Long myDirectDonations;    // direct donations ← NEW
    private Long totalDonationsAll;    // regular + direct combined ← NEW
    private Long pendingDonationsCount;
    private Long approvedDonationsCount;
    private Long deliveredCount;

    // direct donation breakdown ← NEW
    private Long directAvailable;
    private Long directAccepted;
    private Long directCompleted;

	// NGO Stats
    private Long myClaims;
    private Long approvedClaims;
    private Long completedClaims;
    private Long pendingClaimsNgo;

	// Agent stats
	private Long myDeliveries;
	private Long todayDeliveries;
	
	// ── Receiver stats ────────────────────────────────────────
    private Long myReceived;
    private Long receivedCompleted;
    private Long receivedAccepted;

	// Chart data
	private List<Map<String, Object>> monthlyDonations;
	private List<Map<String, Object>> donationsByCity;
	private List<Map<String, Object>> donationsByStatus;
	private List<Map<String, Object>> recentActivity;

}
