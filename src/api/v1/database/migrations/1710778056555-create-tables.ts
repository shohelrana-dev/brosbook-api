import { MigrationInterface, QueryRunner } from "typeorm";

export class createTables1710778056555 implements MigrationInterface {
    name = 'createTables1710778056555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`media\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`format\` varchar(12) NOT NULL, \`width\` int NOT NULL, \`height\` int NOT NULL, \`size\` bigint NULL, \`source\` enum ('conversation', 'post', 'avatar', 'cover_photo', 'comment') NOT NULL, \`creatorId\` varchar(30) NULL, UNIQUE INDEX \`IDX_f4e0fcac36e050de337b670d8b\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`post_likes\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`userId\` varchar(30) NULL, \`postId\` varchar(30) NULL, UNIQUE INDEX \`IDX_e4ac7cb9daf243939c6eabb2e0\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`posts\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`body\` text NULL, \`commentsCount\` int NOT NULL DEFAULT '0', \`likesCount\` int NOT NULL DEFAULT '0', \`imageId\` varchar(30) NULL, \`authorId\` varchar(30) NOT NULL, UNIQUE INDEX \`IDX_2829ac61eff60fcec60d7274b9\` (\`id\`), UNIQUE INDEX \`REL_294625b251f17eca44cc57fbeb\` (\`imageId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`profile\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`phone\` varchar(16) NULL, \`gender\` enum ('male', 'female') NULL, \`bio\` text NULL, \`location\` varchar(255) NULL, \`birthdate\` date NULL, \`coverPhotoId\` varchar(30) NULL, \`userId\` varchar(30) NULL, UNIQUE INDEX \`IDX_3dd8bfc97e4a77c70971591bdc\` (\`id\`), UNIQUE INDEX \`REL_43bd616db0f78cfbf032ecb5d1\` (\`coverPhotoId\`), UNIQUE INDEX \`REL_a24972ebd73b106250713dcddd\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`firstName\` varchar(20) NOT NULL, \`lastName\` varchar(20) NOT NULL, \`username\` varchar(25) NOT NULL, \`email\` varchar(50) NOT NULL, \`password\` varchar(100) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 0, \`emailVerifiedAt\` date NULL, \`avatarId\` varchar(30) NULL, UNIQUE INDEX \`IDX_a3ffb1c0c8416b9fc6f907b743\` (\`id\`), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`REL_3e1f52ec904aed992472f2be14\` (\`avatarId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`comment_likes\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`userId\` varchar(30) NULL, \`commentId\` varchar(30) NULL, UNIQUE INDEX \`IDX_2c299aaf1f903c45ee7e6c7b41\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`comments\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`body\` text NULL, \`likesCount\` int NOT NULL DEFAULT '0', \`authorId\` varchar(30) NULL, \`postId\` varchar(30) NULL, UNIQUE INDEX \`IDX_8bf68bc960f2b69e818bdb90dc\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`reactions\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`name\` varchar(10) NOT NULL, \`senderId\` varchar(30) NULL, \`messageId\` varchar(30) NULL, UNIQUE INDEX \`IDX_0b213d460d0c473bc2fb6ee27f\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`messages\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`body\` text NULL, \`type\` enum ('image', 'file', 'text', 'emoji') NOT NULL DEFAULT 'text', \`seenAt\` date NULL, \`imageId\` varchar(30) NULL, \`conversationId\` varchar(30) NULL, \`senderId\` varchar(30) NULL, UNIQUE INDEX \`IDX_18325f38ae6de43878487eff98\` (\`id\`), UNIQUE INDEX \`REL_520cd815423801ab085dcc7645\` (\`imageId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`conversations\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`user1Id\` varchar(30) NULL, \`user2Id\` varchar(30) NULL, \`lastMessageId\` varchar(30) NULL, UNIQUE INDEX \`IDX_ee34f4f7ced4ec8681f26bf04e\` (\`id\`), UNIQUE INDEX \`REL_c6e63680bca6085833f396ac1f\` (\`lastMessageId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` varchar(30) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`type\` enum ('liked_post', 'commented_post', 'liked_comment', 'followed') NOT NULL, \`readAt\` date NULL, \`postId\` varchar(30) NULL, \`commentId\` varchar(30) NULL, \`recipientId\` varchar(30) NOT NULL, \`initiatorId\` varchar(30) NOT NULL, UNIQUE INDEX \`IDX_6a72c3c0f683f6462415e653c3\` (\`id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`follows\` (\`userId\` varchar(30) NOT NULL, \`followerId\` varchar(30) NOT NULL, INDEX \`IDX_eeb492da6894abf2e0acceb53f\` (\`userId\`), INDEX \`IDX_fdb91868b03a2040db408a5333\` (\`followerId\`), PRIMARY KEY (\`userId\`, \`followerId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`media\` ADD CONSTRAINT \`FK_4fd9c27adef50f63eaef9c34eb4\` FOREIGN KEY (\`creatorId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`post_likes\` ADD CONSTRAINT \`FK_37d337ad54b1aa6b9a44415a498\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`post_likes\` ADD CONSTRAINT \`FK_6999d13aca25e33515210abaf16\` FOREIGN KEY (\`postId\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_294625b251f17eca44cc57fbeb8\` FOREIGN KEY (\`imageId\`) REFERENCES \`media\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`posts\` ADD CONSTRAINT \`FK_c5a322ad12a7bf95460c958e80e\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`profile\` ADD CONSTRAINT \`FK_43bd616db0f78cfbf032ecb5d16\` FOREIGN KEY (\`coverPhotoId\`) REFERENCES \`media\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`profile\` ADD CONSTRAINT \`FK_a24972ebd73b106250713dcddd9\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_3e1f52ec904aed992472f2be147\` FOREIGN KEY (\`avatarId\`) REFERENCES \`media\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comment_likes\` ADD CONSTRAINT \`FK_34d1f902a8a527dbc2502f87c88\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comment_likes\` ADD CONSTRAINT \`FK_abbd506a94a424dd6a3a68d26f4\` FOREIGN KEY (\`commentId\`) REFERENCES \`comments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_4548cc4a409b8651ec75f70e280\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comments\` ADD CONSTRAINT \`FK_e44ddaaa6d058cb4092f83ad61f\` FOREIGN KEY (\`postId\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reactions\` ADD CONSTRAINT \`FK_39658b37e48742185619809407a\` FOREIGN KEY (\`senderId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`reactions\` ADD CONSTRAINT \`FK_da5948c8a32b4ff15065fad3072\` FOREIGN KEY (\`messageId\`) REFERENCES \`messages\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_520cd815423801ab085dcc76455\` FOREIGN KEY (\`imageId\`) REFERENCES \`media\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_e5663ce0c730b2de83445e2fd19\` FOREIGN KEY (\`conversationId\`) REFERENCES \`conversations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_2db9cf2b3ca111742793f6c37ce\` FOREIGN KEY (\`senderId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conversations\` ADD CONSTRAINT \`FK_5ecde0e8532667bde83d87ed0b4\` FOREIGN KEY (\`user1Id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conversations\` ADD CONSTRAINT \`FK_47c90625a3eed92def079e1a78d\` FOREIGN KEY (\`user2Id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`conversations\` ADD CONSTRAINT \`FK_c6e63680bca6085833f396ac1fa\` FOREIGN KEY (\`lastMessageId\`) REFERENCES \`messages\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_93c464aaf70fb0720dc500e93c8\` FOREIGN KEY (\`postId\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_9faba56a12931cf4e38f9dddb49\` FOREIGN KEY (\`commentId\`) REFERENCES \`comments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_db873ba9a123711a4bff527ccd5\` FOREIGN KEY (\`recipientId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_0653e9293cf9afaacfd4cde0483\` FOREIGN KEY (\`initiatorId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`follows\` ADD CONSTRAINT \`FK_eeb492da6894abf2e0acceb53f2\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`follows\` ADD CONSTRAINT \`FK_fdb91868b03a2040db408a53331\` FOREIGN KEY (\`followerId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`follows\` DROP FOREIGN KEY \`FK_fdb91868b03a2040db408a53331\``);
        await queryRunner.query(`ALTER TABLE \`follows\` DROP FOREIGN KEY \`FK_eeb492da6894abf2e0acceb53f2\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_0653e9293cf9afaacfd4cde0483\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_db873ba9a123711a4bff527ccd5\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_9faba56a12931cf4e38f9dddb49\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_93c464aaf70fb0720dc500e93c8\``);
        await queryRunner.query(`ALTER TABLE \`conversations\` DROP FOREIGN KEY \`FK_c6e63680bca6085833f396ac1fa\``);
        await queryRunner.query(`ALTER TABLE \`conversations\` DROP FOREIGN KEY \`FK_47c90625a3eed92def079e1a78d\``);
        await queryRunner.query(`ALTER TABLE \`conversations\` DROP FOREIGN KEY \`FK_5ecde0e8532667bde83d87ed0b4\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_2db9cf2b3ca111742793f6c37ce\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_e5663ce0c730b2de83445e2fd19\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_520cd815423801ab085dcc76455\``);
        await queryRunner.query(`ALTER TABLE \`reactions\` DROP FOREIGN KEY \`FK_da5948c8a32b4ff15065fad3072\``);
        await queryRunner.query(`ALTER TABLE \`reactions\` DROP FOREIGN KEY \`FK_39658b37e48742185619809407a\``);
        await queryRunner.query(`ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_e44ddaaa6d058cb4092f83ad61f\``);
        await queryRunner.query(`ALTER TABLE \`comments\` DROP FOREIGN KEY \`FK_4548cc4a409b8651ec75f70e280\``);
        await queryRunner.query(`ALTER TABLE \`comment_likes\` DROP FOREIGN KEY \`FK_abbd506a94a424dd6a3a68d26f4\``);
        await queryRunner.query(`ALTER TABLE \`comment_likes\` DROP FOREIGN KEY \`FK_34d1f902a8a527dbc2502f87c88\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_3e1f52ec904aed992472f2be147\``);
        await queryRunner.query(`ALTER TABLE \`profile\` DROP FOREIGN KEY \`FK_a24972ebd73b106250713dcddd9\``);
        await queryRunner.query(`ALTER TABLE \`profile\` DROP FOREIGN KEY \`FK_43bd616db0f78cfbf032ecb5d16\``);
        await queryRunner.query(`ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_c5a322ad12a7bf95460c958e80e\``);
        await queryRunner.query(`ALTER TABLE \`posts\` DROP FOREIGN KEY \`FK_294625b251f17eca44cc57fbeb8\``);
        await queryRunner.query(`ALTER TABLE \`post_likes\` DROP FOREIGN KEY \`FK_6999d13aca25e33515210abaf16\``);
        await queryRunner.query(`ALTER TABLE \`post_likes\` DROP FOREIGN KEY \`FK_37d337ad54b1aa6b9a44415a498\``);
        await queryRunner.query(`ALTER TABLE \`media\` DROP FOREIGN KEY \`FK_4fd9c27adef50f63eaef9c34eb4\``);
        await queryRunner.query(`DROP INDEX \`IDX_fdb91868b03a2040db408a5333\` ON \`follows\``);
        await queryRunner.query(`DROP INDEX \`IDX_eeb492da6894abf2e0acceb53f\` ON \`follows\``);
        await queryRunner.query(`DROP TABLE \`follows\``);
        await queryRunner.query(`DROP INDEX \`IDX_6a72c3c0f683f6462415e653c3\` ON \`notifications\``);
        await queryRunner.query(`DROP TABLE \`notifications\``);
        await queryRunner.query(`DROP INDEX \`REL_c6e63680bca6085833f396ac1f\` ON \`conversations\``);
        await queryRunner.query(`DROP INDEX \`IDX_ee34f4f7ced4ec8681f26bf04e\` ON \`conversations\``);
        await queryRunner.query(`DROP TABLE \`conversations\``);
        await queryRunner.query(`DROP INDEX \`REL_520cd815423801ab085dcc7645\` ON \`messages\``);
        await queryRunner.query(`DROP INDEX \`IDX_18325f38ae6de43878487eff98\` ON \`messages\``);
        await queryRunner.query(`DROP TABLE \`messages\``);
        await queryRunner.query(`DROP INDEX \`IDX_0b213d460d0c473bc2fb6ee27f\` ON \`reactions\``);
        await queryRunner.query(`DROP TABLE \`reactions\``);
        await queryRunner.query(`DROP INDEX \`IDX_8bf68bc960f2b69e818bdb90dc\` ON \`comments\``);
        await queryRunner.query(`DROP TABLE \`comments\``);
        await queryRunner.query(`DROP INDEX \`IDX_2c299aaf1f903c45ee7e6c7b41\` ON \`comment_likes\``);
        await queryRunner.query(`DROP TABLE \`comment_likes\``);
        await queryRunner.query(`DROP INDEX \`REL_3e1f52ec904aed992472f2be14\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_a3ffb1c0c8416b9fc6f907b743\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`REL_a24972ebd73b106250713dcddd\` ON \`profile\``);
        await queryRunner.query(`DROP INDEX \`REL_43bd616db0f78cfbf032ecb5d1\` ON \`profile\``);
        await queryRunner.query(`DROP INDEX \`IDX_3dd8bfc97e4a77c70971591bdc\` ON \`profile\``);
        await queryRunner.query(`DROP TABLE \`profile\``);
        await queryRunner.query(`DROP INDEX \`REL_294625b251f17eca44cc57fbeb\` ON \`posts\``);
        await queryRunner.query(`DROP INDEX \`IDX_2829ac61eff60fcec60d7274b9\` ON \`posts\``);
        await queryRunner.query(`DROP TABLE \`posts\``);
        await queryRunner.query(`DROP INDEX \`IDX_e4ac7cb9daf243939c6eabb2e0\` ON \`post_likes\``);
        await queryRunner.query(`DROP TABLE \`post_likes\``);
        await queryRunner.query(`DROP INDEX \`IDX_f4e0fcac36e050de337b670d8b\` ON \`media\``);
        await queryRunner.query(`DROP TABLE \`media\``);
    }

}
