-- =============================================
-- Moya List Database DDL
-- 생성일: 2025-01-07
-- =============================================

-- 테이블 생성
CREATE TABLE `users` (
	`id` BIGINT NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(50) NULL,
	`email` VARCHAR(255) NOT NULL UNIQUE,
	`profile_url` VARCHAR(500) NULL,
	`provider` VARCHAR(20) NULL,
	`provider_id` VARCHAR(255) NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
);

CREATE TABLE `questions` (
	`id` BIGINT NOT NULL AUTO_INCREMENT,
	`user_id` BIGINT NOT NULL,
	`title` VARCHAR(500) NOT NULL,
	`description` TEXT NULL,
	`source_url` VARCHAR(1000) NULL,
	`is_resolved` BOOLEAN NOT NULL DEFAULT FALSE,
	`resolved_at` DATETIME NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
);

CREATE TABLE `tags` (
	`id` BIGINT NOT NULL AUTO_INCREMENT,
	`user_id` BIGINT NOT NULL,
	`name` VARCHAR(50) NOT NULL,
	`color` VARCHAR(20) NOT NULL DEFAULT '#6B7280',
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	UNIQUE KEY `UK_user_tag_name` (`user_id`, `name`)
);

CREATE TABLE `attachments` (
	`id` BIGINT NOT NULL AUTO_INCREMENT,
	`question_id` BIGINT NOT NULL,
	`file_url` VARCHAR(500) NOT NULL,
	`original_name` VARCHAR(255) NULL,
	`file_size` INT NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`)
);

CREATE TABLE `question_tags` (
	`question_id` BIGINT NOT NULL,
	`tag_id` BIGINT NOT NULL,
	PRIMARY KEY (`question_id`, `tag_id`)
);

CREATE TABLE `guest_questions` (
	`id` BIGINT NOT NULL AUTO_INCREMENT,
	`session_id` VARCHAR(255) NOT NULL,
	`title` VARCHAR(500) NOT NULL,
	`source_url` VARCHAR(1000) NULL,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`id`),
	INDEX `IDX_session_id` (`session_id`)
);

-- 외래키 제약조건
ALTER TABLE `questions` 
	ADD CONSTRAINT `FK_questions_user` 
	FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `tags` 
	ADD CONSTRAINT `FK_tags_user` 
	FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `attachments` 
	ADD CONSTRAINT `FK_attachments_question` 
	FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`);

ALTER TABLE `question_tags` 
	ADD CONSTRAINT `FK_question_tags_question` 
	FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`);

ALTER TABLE `question_tags` 
	ADD CONSTRAINT `FK_question_tags_tag` 
	FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`);
