-- CreateTable
CREATE TABLE `user_info` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_name` VARCHAR(50) NOT NULL,
    `user_address` VARCHAR(100) NOT NULL,
    `phone_number` VARCHAR(15) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `google_sub` VARCHAR(255) NULL,
    `avatar` VARCHAR(500) NULL,

    UNIQUE INDEX `user_info_phone_number_key`(`phone_number`),
    UNIQUE INDEX `user_info_email_key`(`email`),
    UNIQUE INDEX `user_info_google_sub_key`(`google_sub`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_name` VARCHAR(50) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `items_item_name_key`(`item_name`),
    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ongoing_complaints` (
    `complaint_id` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `user_id` INTEGER NULL,
    `phone_number` VARCHAR(15) NOT NULL,
    `address` VARCHAR(100) NOT NULL,
    `description` VARCHAR(250) NOT NULL,
    `worker_id` INTEGER NULL,
    `status` ENUM('ongoing', 'delayed', 'booked') NOT NULL DEFAULT 'booked',

    INDEX `ongoing_complaints_user_id_idx`(`user_id`),
    INDEX `ongoing_complaints_worker_id_idx`(`worker_id`),
    PRIMARY KEY (`complaint_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaint_items` (
    `s_no` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `complaint_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    INDEX `complaint_items_complaint_id_idx`(`complaint_id`),
    INDEX `complaint_items_item_id_idx`(`item_id`),
    UNIQUE INDEX `complaint_items_complaint_id_item_id_key`(`complaint_id`, `item_id`),
    PRIMARY KEY (`s_no`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demanded_items` (
    `s_no` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `worker_id` INTEGER NOT NULL,
    `complaint_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    INDEX `demanded_items_worker_id_idx`(`worker_id`),
    INDEX `demanded_items_complaint_id_idx`(`complaint_id`),
    INDEX `demanded_items_item_id_idx`(`item_id`),
    UNIQUE INDEX `demanded_items_worker_id_complaint_id_item_id_key`(`worker_id`, `complaint_id`, `item_id`),
    PRIMARY KEY (`s_no`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `worker_debt` (
    `s_no` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `worker_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    INDEX `worker_debt_worker_id_idx`(`worker_id`),
    INDEX `worker_debt_item_id_idx`(`item_id`),
    UNIQUE INDEX `worker_debt_worker_id_item_id_key`(`worker_id`, `item_id`),
    PRIMARY KEY (`s_no`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `worker_info` (
    `worker_id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `worker_phone_number` VARCHAR(15) NOT NULL,
    `designation` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`worker_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alloted_task` (
    `worker_id` INTEGER NOT NULL,
    `alloted_task` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`worker_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `worker_credentials` (
    `worker_id` INTEGER NOT NULL,
    `worker_password` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`worker_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ongoing_complaints` ADD CONSTRAINT `ongoing_complaints_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user_info`(`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ongoing_complaints` ADD CONSTRAINT `ongoing_complaints_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `worker_info`(`worker_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `complaint_items` ADD CONSTRAINT `complaint_items_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `ongoing_complaints`(`complaint_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `complaint_items` ADD CONSTRAINT `complaint_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `demanded_items` ADD CONSTRAINT `demanded_items_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `worker_info`(`worker_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `demanded_items` ADD CONSTRAINT `demanded_items_complaint_id_fkey` FOREIGN KEY (`complaint_id`) REFERENCES `ongoing_complaints`(`complaint_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `demanded_items` ADD CONSTRAINT `demanded_items_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `worker_debt` ADD CONSTRAINT `worker_debt_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `worker_info`(`worker_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `worker_debt` ADD CONSTRAINT `worker_debt_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`item_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `alloted_task` ADD CONSTRAINT `alloted_task_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `worker_info`(`worker_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `worker_credentials` ADD CONSTRAINT `worker_credentials_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `worker_info`(`worker_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
