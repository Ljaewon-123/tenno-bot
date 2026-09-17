import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 1회용 리마인더 중복 방지(2026-09-17) — 엔티티 @Index는 dev synchronize에만 반영되고 프로덕션은 synchronize가 꺼져 있다.
 * 이미 중복 행이 있으면 CREATE UNIQUE INDEX가 실패해 migrationsRun과 함께 부팅이 죽으므로 먼저 정리한다.
 * id가 ulid라 문자열 비교가 곧 생성 순서 — 가장 먼저 건 것만 남긴다.
 */
export class AlarmOneShotUnique1789650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "alarm_config" a
      USING "alarm_config" b
      WHERE a."user_id" IS NOT NULL
        AND a."guild_id" = b."guild_id"
        AND a."user_id" = b."user_id"
        AND a."name" = b."name"
        AND a."id" > b."id"
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_alarm_config_guild_user_name" ON "alarm_config" ("guild_id", "user_id", "name") WHERE user_id IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_alarm_config_guild_user_name"`,
    );
  }
}
