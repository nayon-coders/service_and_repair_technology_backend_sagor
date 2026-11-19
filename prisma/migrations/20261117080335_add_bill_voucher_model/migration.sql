-- CreateTable
CREATE TABLE `bill_vouchers` (
    `id` VARCHAR(191) NOT NULL,
    `voucher_no` VARCHAR(50) NOT NULL,
    `date` DATE NOT NULL,
    `customer_type` ENUM('CORPORATE', 'NON_CORPORATE') NOT NULL DEFAULT 'CORPORATE',
    `bill_type` ENUM('REPAIR', 'SERVICE', 'BOTH') NOT NULL DEFAULT 'REPAIR',
    `customer_name` VARCHAR(255) NOT NULL,
    `mobile` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `machine_name` VARCHAR(255) NULL,
    `brand_model` VARCHAR(255) NULL,
    `serial_no` VARCHAR(100) NULL,
    `department` VARCHAR(100) NULL,
    `problem_complaint` TEXT NULL,
    `received_date` DATE NULL,
    `parts_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `service_charge` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `grand_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `due_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `amount_in_words` VARCHAR(255) NULL,
    `warranty_terms` VARCHAR(255) NULL,
    `payment_status` ENUM('PAID', 'DUE', 'PARTIAL') NOT NULL DEFAULT 'DUE',
    `payment_method` ENUM('CASH', 'BANK', 'BKASH', 'OTHER') NOT NULL DEFAULT 'CASH',
    `payment_method_other` VARCHAR(100) NULL,
    `prepared_by` VARCHAR(100) NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bill_vouchers_voucher_no_key`(`voucher_no`),
    INDEX `bill_vouchers_voucher_no_idx`(`voucher_no`),
    INDEX `bill_vouchers_customer_type_idx`(`customer_type`),
    INDEX `bill_vouchers_date_idx`(`date`),
    INDEX `bill_vouchers_payment_status_idx`(`payment_status`),
    INDEX `bill_vouchers_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bill_voucher_items` (
    `id` VARCHAR(191) NOT NULL,
    `voucher_id` VARCHAR(191) NOT NULL,
    `sl` INTEGER NOT NULL DEFAULT 1,
    `description` VARCHAR(255) NOT NULL,
    `qty` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `remarks` VARCHAR(100) NULL,

    INDEX `bill_voucher_items_voucher_id_idx`(`voucher_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bill_vouchers` ADD CONSTRAINT `bill_vouchers_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bill_voucher_items` ADD CONSTRAINT `bill_voucher_items_voucher_id_fkey` FOREIGN KEY (`voucher_id`) REFERENCES `bill_vouchers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
