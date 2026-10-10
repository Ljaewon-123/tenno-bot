import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 알람 최소 주기 10분(2026-10-10) — 커맨드 옵션 min_value는 새 등록만 막는다.
 * 이미 1분 주기로 저장된 알람은 그대로 돌아서 데이터를 올린다. 실행 시점에 보정하면 /alarm list가 여전히 "every 1 min"으로 보인다
 */
export class AlarmIntervalFloor1791600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      // 0 이하는 afterFire가 1회용으로 보는 값이라 반복 알람으로 바꾸지 않는다
      `UPDATE "alarm_config" SET "interval_value" = 10 WHERE "interval_value" BETWEEN 1 AND 9`,
    );
  }

  /** 원래 주기는 남기지 않았다 — 되돌릴 값이 없다 */
  public async down(): Promise<void> {}
}
