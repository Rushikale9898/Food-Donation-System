package com.fooddonation.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fooddonation.entity.ReceiverProfile;

@Repository
public interface ReceiverProfileRepository extends JpaRepository<ReceiverProfile, Long> {

	Optional<ReceiverProfile> findByUserId(Long userId);

	boolean existsByUserId(Long userId);

}
