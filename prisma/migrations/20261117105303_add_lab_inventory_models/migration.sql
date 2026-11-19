-- CreateTable
CREATE TABLE `lab_parts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `part_number` VARCHAR(100) NULL,
    `unit` VARCHAR(30) NOT NULL DEFAULT 'pcs',
    `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `stock_quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_in_quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_out_quantity` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lab_parts_name_key`(`name`),
    INDEX `lab_parts_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_ins` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `part_id` VARCHAR(191) NOT NULL,
    `parts_name` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL,
    `supplier` VARCHAR(150) NULL,
    `invoice_no` VARCHAR(100) NULL,
    `remarks` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lab_ins_date_idx`(`date`),
    INDEX `lab_ins_part_id_idx`(`part_id`),
    INDEX `lab_ins_parts_name_idx`(`parts_name`),
    INDEX `lab_ins_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_outs` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `part_id` VARCHAR(191) NOT NULL,
    `parts_name` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL,
    `dispatched_to` VARCHAR(150) NULL,
    `reference_no` VARCHAR(100) NULL,
    `remarks` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `lab_outs_date_idx`(`date`),
    INDEX `lab_outs_part_id_idx`(`part_id`),
    INDEX `lab_outs_parts_name_idx`(`parts_name`),
    INDEX `lab_outs_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lab_ins` ADD CONSTRAINT `lab_ins_part_id_fkey` FOREIGN KEY (`part_id`) REFERENCES `lab_parts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_ins` ADD CONSTRAINT `lab_ins_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_outs` ADD CONSTRAINT `lab_outs_part_id_fkey` FOREIGN KEY (`part_id`) REFERENCES `lab_parts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lab_outs` ADD CONSTRAINT `lab_outs_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
