-- AlterTable
ALTER TABLE `ngos` ADD COLUMN `capacity_notes` VARCHAR(190) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `availability` VARCHAR(190) NULL,
    ADD COLUMN `city` VARCHAR(120) NULL,
    ADD COLUMN `donor_type` VARCHAR(80) NULL,
    ADD COLUMN `has_vehicle` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `organization_name` VARCHAR(190) NULL;
