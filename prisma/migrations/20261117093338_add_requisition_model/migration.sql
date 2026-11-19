-- CreateTable
CREATE TABLE `requisitions` (
    `id` VARCHAR(191) NOT NULL,
    `estimate_no` VARCHAR(50) NOT NULL,
    `date` DATE NOT NULL,
    `valid_up_to` DATE NULL,
    `customer_type` ENUM('CORPORATE', 'NON_CORPORATE') NOT NULL DEFAULT 'CORPORATE',
    `organization_name` VARCHAR(255) NOT NULL,
    `department_ward` VARCHAR(100) NULL,
    `contact_person` VARCHAR(100) NULL,
    `contact_no` VARCHAR(50) NULL,
    `equipment_name` VARCHAR(255) NULL,
    `brand` VARCHAR(100) NULL,
    `model` VARCHAR(100) NULL,
    `serial_no` VARCHAR(100) NULL,
    `fault_description` TEXT NULL,
    `spare_parts_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `service_labour_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sub_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `grand_total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `prepared_by` VARCHAR(100) NULL DEFAULT '1 Service & Repair Technology.',
    `client_approval_note` VARCHAR(255) NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `requisitions_estimate_no_key`(`estimate_no`),
    INDEX `requisitions_estimate_no_idx`(`estimate_no`),
    INDEX `requisitions_customer_type_idx`(`customer_type`),
    INDEX `requisitions_date_idx`(`date`),
    INDEX `requisitions_status_idx`(`status`),
    INDEX `requisitions_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisition_items` (
    `id` VARCHAR(191) NOT NULL,
    `requisition_id` VARCHAR(191) NOT NULL,
    `category` ENUM('SPARE_PARTS', 'SERVICE_LABOUR') NOT NULL DEFAULT 'SPARE_PARTS',
    `sl` INTEGER NOT NULL DEFAULT 1,
    `description` VARCHAR(255) NOT NULL,
    `qty` DECIMAL(10, 2) NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `remarks` VARCHAR(100) NULL,

    INDEX `requisition_items_requisition_id_idx`(`requisition_id`),
    INDEX `requisition_items_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `requisitions` ADD CONSTRAINT `requisitions_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_items` ADD CONSTRAINT `requisition_items_requisition_id_fkey` FOREIGN KEY (`requisition_id`) REFERENCES `requisitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
