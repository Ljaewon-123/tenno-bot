import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 1회용 리마인더(🔔 버튼)가 alarm_config에 낸 변경 — 2026-09-05 커밋이 dev의 synchronize에만 얹혀 있었다.
 * interval_value가 비어 있는 것 하나가 "반복이 아니라 1회용"을 가르므로 NOT NULL이 풀려야 한다.
 */
export class AlarmOneShotReminder1789000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alarm_config" ALTER COLUMN "interval_value" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alarm_config" ADD COLUMN IF NOT EXISTS "user_id" text`,
    );
    // DM 대상 조회와 토글(같은 유저가 같은 대상을 다시 누르면 취소)이 이 컬럼으로 찾는다
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_alarm_config_user_id" ON "alarm_config" ("user_id")`,
    );
  }

  /** 되돌리면 1회용 행은 살아남을 수 없다 — NOT NULL을 다시 걸려면 먼저 지워야 한다 */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_alarm_config_user_id"`);
    await queryRunner.query(`ALTER TABLE "alarm_config" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `DELETE FROM "alarm_config" WHERE "interval_value" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "alarm_config" ALTER COLUMN "interval_value" SET NOT NULL`,
    );
  }
}
