-- CreateTable
CREATE TABLE `tada_bills` (
    `id` VARCHAR(191) NOT NULL,
    `bill_no` VARCHAR(50) NOT NULL,
    `submission_date` DATE NOT NULL,
    `employee_name` VARCHAR(150) NOT NULL,
    `designation` VARCHAR(100) NULL,
    `employee_id` VARCHAR(50) NULL,
    `department` VARCHAR(100) NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID') NOT NULL DEFAULT 'PENDING',
    `received_by` VARCHAR(100) NULL,
    `checked_by` VARCHAR(100) NULL,
    `approved_by` VARCHAR(100) NULL,
    `remarks` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tada_bills_bill_no_key`(`bill_no`),
    INDEX `tada_bills_bill_no_idx`(`bill_no`),
    INDEX `tada_bills_submission_date_idx`(`submission_date`),
    INDEX `tada_bills_employee_name_idx`(`employee_name`),
    INDEX `tada_bills_status_idx`(`status`),
    INDEX `tada_bills_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tada_items` (
    `id` VARCHAR(191) NOT NULL,
    `tada_bill_id` VARCHAR(191) NOT NULL,
    `sl` INTEGER NOT NULL DEFAULT 1,
    `date` DATE NULL,
    `particular` VARCHAR(255) NOT NULL,
    `vehicle_name` VARCHAR(100) NULL,
    `qty` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `unit_taka` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_taka` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `checked_by` VARCHAR(100) NULL,

    INDEX `tada_items_tada_bill_id_idx`(`tada_bill_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tada_bills` ADD CONSTRAINT `tada_bills_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tada_items` ADD CONSTRAINT `tada_items_tada_bill_id_fkey` FOREIGN KEY (`tada_bill_id`) REFERENCES `tada_bills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
