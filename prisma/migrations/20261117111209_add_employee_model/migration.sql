-- CreateTable
CREATE TABLE `employees` (
    `id` VARCHAR(191) NOT NULL,
    `employee_id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `designation` VARCHAR(100) NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `basic_salary` DECIMAL(12, 2) NOT NULL,
    `allowance` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `gross_salary` DECIMAL(12, 2) NOT NULL,
    `join_date` DATE NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `address` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_employee_id_key`(`employee_id`),
    INDEX `employees_employee_id_idx`(`employee_id`),
    INDEX `employees_name_idx`(`name`),
    INDEX `employees_email_idx`(`email`),
    INDEX `employees_department_idx`(`department`),
    INDEX `employees_status_idx`(`status`),
    INDEX `employees_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
