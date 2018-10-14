SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema intoTheWoodsDB
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema intoTheWoodsDB
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `intoTheWoodsDB` DEFAULT CHARACTER SET utf8 ;
USE `intoTheWoodsDB` ;

CREATE USER 'gluser2018'@'localhost' IDENTIFIED BY 'glpass2018';
GRANT ALL PRIVILEGES ON intoTheWoodsDB.* TO 'gluser2018'@'localhost' IDENTIFIED BY 'glpass2018' WITH GRANT OPTION;

#sequelize-auto -o "./models" -d intoTheWoodsDB -h localhost -u gluser2018 -x glpass2018 -e mysql

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`raid`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`raid` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL,
  `date` DATE NULL,
  `edition` SMALLINT NULL,
  `place` VARCHAR(45) NULL,
  `lat` DOUBLE NULL,
  `lng` DOUBLE NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`video`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`video` (
  `id_raid` INT UNSIGNED NOT NULL,
  `url` VARCHAR(128) NULL,
  CONSTRAINT `fk_id_raid`
    FOREIGN KEY (`id_raid`)
    REFERENCES `intoTheWoodsDB`.`raid` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`organizer`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`organizer` (
  `email` VARCHAR(45) NOT NULL,
  `last_name` VARCHAR(30) NULL,
  `first_name` VARCHAR(30) NULL,
  `password` BLOB(128) NULL,
  PRIMARY KEY (`email`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`team`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`team` (
  `id_raid` INT UNSIGNED NOT NULL,
  `id_organizer` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_raid`, `id_organizer`),
  CONSTRAINT `id_organizer`
    FOREIGN KEY (`id_organizer`)
    REFERENCES `intoTheWoodsDB`.`organizer` (`email`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `id_raid`
    FOREIGN KEY (`id_raid`)
    REFERENCES `intoTheWoodsDB`.`raid` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`participant`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`participant` (
  `id_participant` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_raid` INT UNSIGNED NOT NULL,
  `last_name` VARCHAR(30) NULL,
  `first_name` VARCHAR(30) NULL,
  PRIMARY KEY (`id_participant`),
  CONSTRAINT `fk_id_raid_2`
    FOREIGN KEY (`id_raid`)
    REFERENCES `intoTheWoodsDB`.`raid` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`sport`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`sport` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL,
  `area_type` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`course`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`course` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_num` SMALLINT UNSIGNED NOT NULL,
  `label` VARCHAR(45) NULL,
  `id_sport` INT UNSIGNED NOT NULL,
  `id_raid` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `id_sport`
    FOREIGN KEY (`id_sport`)
    REFERENCES `intoTheWoodsDB`.`sport` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_id_raid_3`
    FOREIGN KEY (`id_raid`)
    REFERENCES `intoTheWoodsDB`.`raid` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`stage`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`stage` (
  `id_participant` INT UNSIGNED NOT NULL,
  `id_course` INT UNSIGNED NOT NULL,
  `time` TIME NULL,
  PRIMARY KEY (`id_participant`, `id_course`),
  CONSTRAINT `id_participant`
    FOREIGN KEY (`id_participant`)
    REFERENCES `intoTheWoodsDB`.`participant` (`id_participant`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `id_course`
    FOREIGN KEY (`id_course`)
    REFERENCES `intoTheWoodsDB`.`course` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`track_point`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`track_point` (
  `id_track` INT UNSIGNED NOT NULL,
  `lat` DOUBLE NULL,
  `lng` DOUBLE NULL,
  CONSTRAINT `fk_track_point`
    FOREIGN KEY (`id_track`)
    REFERENCES `intoTheWoodsDB`.`course` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`point_of_interest`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`point_of_interest` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_track` INT UNSIGNED NOT NULL,
  `lat` DOUBLE NULL,
  `lng` DOUBLE NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_point_of_interest`
    FOREIGN KEY (`id_track`)
    REFERENCES `intoTheWoodsDB`.`course` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`helper`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`helper` (
  `login` VARCHAR(7) NOT NULL,
  `last_name` VARCHAR(30) NULL,
  `first_name` VARCHAR(30) NULL,
  `check_in` TINYINT(1) NOT NULL DEFAULT 0,
  `backup` TINYINT(1) NULL,
  PRIMARY KEY (`login`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`helper_post`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`helper_post` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_point_of_interest` INT UNSIGNED NOT NULL,
  `description` VARCHAR(1024) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `id_point_of_interest`
    FOREIGN KEY (`id_point_of_interest`)
    REFERENCES `intoTheWoodsDB`.`point_of_interest` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `intoTheWoodsDB`.`assignment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `intoTheWoodsDB`.`assignment` (
  `id_helper` VARCHAR(7) NOT NULL,
  `id_helper_post` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_helper`, `id_helper_post`),
  CONSTRAINT `id_helper`
    FOREIGN KEY (`id_helper`)
    REFERENCES `intoTheWoodsDB`.`helper` (`login`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `id_helper_post`
    FOREIGN KEY (`id_helper_post`)
    REFERENCES `intoTheWoodsDB`.`helper_post` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;


INSERT INTO `sport` (`id`, `name`, `area_type`) VALUES (NULL, 'Canoë', 'Eau'), (NULL, 'Kayak', 'Eau'), (NULL, 'Rafting', 'Eau'), (NULL, 'Course à pied', 'Sol'), (NULL, 'Trail', 'Sol'), (NULL, 'Course d\'orientation', 'Sol'), (NULL, 'Run & Bike', 'Sol'), (NULL, 'Swimrun', 'Eau'), (NULL, 'Escalade', 'Parois rocheuse'), (NULL, 'VTT', 'Sol'), (NULL, 'Trekking', 'Sol'), (NULL, 'Ski de fond', 'Neige'), (NULL, 'Ski alpin', 'Neige'), (NULL, 'Ski slalom', 'Neige'), (NULL, 'Saut à ski', 'Neige');