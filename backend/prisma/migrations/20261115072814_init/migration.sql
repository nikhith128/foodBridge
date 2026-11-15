-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('DONOR', 'NGO', 'VOLUNTEER') NOT NULL,
    `phone` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ngos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `organisation_name` VARCHAR(190) NOT NULL,
    `address` TEXT NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `storage_capacity` DECIMAL(10, 2) NOT NULL,
    `food_preference` VARCHAR(120) NULL,
    `is_accepting` BOOLEAN NOT NULL DEFAULT true,
    `verification_status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ngos_user_id_key`(`user_id`),
    INDEX `ngos_verification_status_idx`(`verification_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `donations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `donor_id` INTEGER NOT NULL,
    `food_name` VARCHAR(190) NOT NULL,
    `food_category` VARCHAR(80) NOT NULL,
    `food_type` ENUM('VEG', 'NON_VEG') NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `quantity_unit` VARCHAR(20) NOT NULL DEFAULT 'kg',
    `preparation_time` DATETIME(3) NOT NULL,
    `storage_condition` VARCHAR(190) NOT NULL,
    `expiry_time` DATETIME(3) NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `description` TEXT NULL,
    `status` ENUM('AVAILABLE', 'ACCEPTED', 'ASSIGNED', 'PICKED_UP', 'COMPLETED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'AVAILABLE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `donations_status_idx`(`status`),
    INDEX `donations_expiry_time_idx`(`expiry_time`),
    INDEX `donations_donor_id_idx`(`donor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `donation_id` INTEGER NOT NULL,
    `ngo_id` INTEGER NOT NULL,
    `compatibility_score` DECIMAL(5, 2) NOT NULL,
    `distance` DECIMAL(8, 2) NULL,
    `explanation` TEXT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `matches_donation_id_idx`(`donation_id`),
    INDEX `matches_status_idx`(`status`),
    UNIQUE INDEX `matches_donation_id_ngo_id_key`(`donation_id`, `ngo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pickups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `donation_id` INTEGER NOT NULL,
    `ngo_id` INTEGER NOT NULL,
    `volunteer_id` INTEGER NULL,
    `pickup_time` DATETIME(3) NULL,
    `delivery_time` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PICKED_UP', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pickups_donation_id_key`(`donation_id`),
    INDEX `pickups_ngo_id_idx`(`ngo_id`),
    INDEX `pickups_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ngos` ADD CONSTRAINT `ngos_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `donations` ADD CONSTRAINT `donations_donor_id_fkey` FOREIGN KEY (`donor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_donation_id_fkey` FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_ngo_id_fkey` FOREIGN KEY (`ngo_id`) REFERENCES `ngos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pickups` ADD CONSTRAINT `pickups_donation_id_fkey` FOREIGN KEY (`donation_id`) REFERENCES `donations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pickups` ADD CONSTRAINT `pickups_ngo_id_fkey` FOREIGN KEY (`ngo_id`) REFERENCES `ngos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pickups` ADD CONSTRAINT `pickups_volunteer_id_fkey` FOREIGN KEY (`volunteer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
