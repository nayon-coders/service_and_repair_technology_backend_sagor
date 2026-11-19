-- CreateTable
CREATE TABLE `office_rents` (
    `id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(50) NOT NULL,
    `title` VARCHAR(150) NOT NULL DEFAULT 'Office rent',
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
    `payment_date` DATE NULL,
    `payment_method` VARCHAR(50) NULL,
    `landlord_name` VARCHAR(150) NULL,
    `receipt_no` VARCHAR(100) NULL,
    `note` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `office_rents_month_idx`(`month`),
    INDEX `office_rents_status_idx`(`status`),
    INDEX `office_rents_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `office_rents` ADD CONSTRAINT `office_rents_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
