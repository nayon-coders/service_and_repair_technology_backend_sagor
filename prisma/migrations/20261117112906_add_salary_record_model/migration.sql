-- CreateTable
CREATE TABLE `salary_records` (
    `id` VARCHAR(191) NOT NULL,
    `month` VARCHAR(50) NOT NULL,
    `employee_id_ref` VARCHAR(191) NULL,
    `employee_name` VARCHAR(120) NOT NULL,
    `employee_code` VARCHAR(50) NOT NULL,
    `designation` VARCHAR(100) NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `basic_salary` DECIMAL(12, 2) NOT NULL,
    `allowance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_days` INTEGER NOT NULL DEFAULT 30,
    `present_days` INTEGER NOT NULL DEFAULT 30,
    `absent_days` INTEGER NOT NULL DEFAULT 0,
    `total_earnings` DECIMAL(12, 2) NOT NULL,
    `advance_loan` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `previous_due` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `net_payable` DECIMAL(12, 2) NOT NULL,
    `paid_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `due_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `payment_status` ENUM('PAID', 'PARTIAL', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
    `payment_method` VARCHAR(50) NULL,
    `payment_date` DATE NULL,
    `notes` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `salary_records_month_idx`(`month`),
    INDEX `salary_records_employee_code_idx`(`employee_code`),
    INDEX `salary_records_employee_name_idx`(`employee_name`),
    INDEX `salary_records_department_idx`(`department`),
    INDEX `salary_records_payment_status_idx`(`payment_status`),
    INDEX `salary_records_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `salary_records` ADD CONSTRAINT `salary_records_employee_id_ref_fkey` FOREIGN KEY (`employee_id_ref`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salary_records` ADD CONSTRAINT `salary_records_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
