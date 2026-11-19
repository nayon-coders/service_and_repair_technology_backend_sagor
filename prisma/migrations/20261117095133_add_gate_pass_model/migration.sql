-- CreateTable
CREATE TABLE `gate_passes` (
    `id` VARCHAR(191) NOT NULL,
    `pass_no` VARCHAR(50) NOT NULL,
    `date` DATE NOT NULL,
    `customer_type` ENUM('CORPORATE', 'NON_CORPORATE') NOT NULL DEFAULT 'CORPORATE',
    `pass_type` ENUM('RETURNABLE', 'NON_RETURNABLE') NOT NULL DEFAULT 'RETURNABLE',
    `organization_name` VARCHAR(255) NOT NULL,
    `department_ward` VARCHAR(100) NULL,
    `contact_person` VARCHAR(100) NULL,
    `contact_no` VARCHAR(50) NULL,
    `destination` VARCHAR(255) NULL,
    `vehicle_no` VARCHAR(100) NULL,
    `carrier_name` VARCHAR(100) NULL,
    `purpose` TEXT NULL,
    `expected_return_date` DATE NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DISPATCHED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `prepared_by` VARCHAR(100) NULL DEFAULT '1 Service & Repair Technology.',
    `authorized_by` VARCHAR(100) NULL,
    `received_by` VARCHAR(100) NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `gate_passes_pass_no_key`(`pass_no`),
    INDEX `gate_passes_pass_no_idx`(`pass_no`),
    INDEX `gate_passes_customer_type_idx`(`customer_type`),
    INDEX `gate_passes_date_idx`(`date`),
    INDEX `gate_passes_status_idx`(`status`),
    INDEX `gate_passes_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gate_pass_items` (
    `id` VARCHAR(191) NOT NULL,
    `gate_pass_id` VARCHAR(191) NOT NULL,
    `sl` INTEGER NOT NULL DEFAULT 1,
    `description` VARCHAR(255) NOT NULL,
    `qty` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `serial_no` VARCHAR(100) NULL,
    `remarks` VARCHAR(100) NULL,

    INDEX `gate_pass_items_gate_pass_id_idx`(`gate_pass_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gate_passes` ADD CONSTRAINT `gate_passes_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gate_pass_items` ADD CONSTRAINT `gate_pass_items_gate_pass_id_fkey` FOREIGN KEY (`gate_pass_id`) REFERENCES `gate_passes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
