-- AlterTable
ALTER TABLE `gate_passes` ADD COLUMN `accessories_received` TEXT NULL,
    ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `asset_id_no` VARCHAR(100) NULL,
    ADD COLUMN `brand_manufacturer` VARCHAR(100) NULL,
    ADD COLUMN `challan_kind` ENUM('RECEIVING', 'RETURN') NOT NULL DEFAULT 'RECEIVING',
    ADD COLUMN `delivered_by` VARCHAR(100) NULL,
    ADD COLUMN `designation_staff_id` VARCHAR(100) NULL,
    ADD COLUMN `gate_pass_category` VARCHAR(100) NULL,
    ADD COLUMN `machine_condition` VARCHAR(50) NULL,
    ADD COLUMN `machine_name` VARCHAR(255) NULL,
    ADD COLUMN `model_no` VARCHAR(100) NULL,
    ADD COLUMN `pending_issues_advice` TEXT NULL,
    ADD COLUMN `physical_damage_condition` TEXT NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `reference_work_order_no` VARCHAR(100) NULL,
    ADD COLUMN `reported_problem` TEXT NULL,
    ADD COLUMN `return_condition` VARCHAR(100) NULL,
    ADD COLUMN `return_date` DATE NULL,
    ADD COLUMN `returned_accessories` TEXT NULL,
    ADD COLUMN `serial_no` VARCHAR(100) NULL,
    ADD COLUMN `service_report_no` VARCHAR(100) NULL,
    ADD COLUMN `transport_purpose` VARCHAR(100) NULL,
    ADD COLUMN `work_done_comments` TEXT NULL;

-- CreateIndex
CREATE INDEX `gate_passes_challan_kind_idx` ON `gate_passes`(`challan_kind`);
