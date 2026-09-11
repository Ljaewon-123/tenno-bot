/**
 * wiki.warframe.com `{무기} Incarnon Genesis` 페이지의 Evolutions 표 파싱 결과.
 * 퍽·해금 조건은 어느 API에도 없다 — WFCD에도, DE Public Export에도 없어서 위키가 유일한 출처다.
 */

export interface IncarnonPerk {
  name: string;
  /** 위키 File: 이름. 임베드 이미지 슬롯이 모자라 아직 안 쓰지만, 파싱 때 버리면 다시 못 만든다 */
  icon: string;
  /** 불릿 한 줄이 한 항목. 수치는 최상위 변종 열 기준으로 이미 치환돼 있다 */
  effect: string[];
}

export interface IncarnonTier {
  /** EVO 번호 1~4 */
  evolution: number;
  /**
   * 이 티어를 여는 조건. 표에서는 이전 티어 **뒤에** 놓인 행이라 한 칸 당겨 붙인다 —
   * 설치하면 EVO1이 바로 열리므로 EVO1만 조건이 없다.
   */
  challenge?: string;
  perks: IncarnonPerk[];
}

/** 설치 재료 한 줄. 이름·아이콘은 uniqueName으로 wfcd에서 붙인다 */
export interface IncarnonMaterial {
  uniqueName: string;
  count: number;
}

export interface IncarnonWeapon {
  /**
   * 수치의 기준이 된 최상위 변종. 위키가 열을 기본→변종→프라임 순으로 놓아 보통 마지막 열이지만
   * Mk1은 뒤에 와도 열화판이라 건너뛴다. 변종 열이 아예 없는 페이지는 undefined.
   */
  reference?: string;
  tiers: IncarnonTier[];
}

/** 캐시 한 행(jsonb)에 통째로 들어가는 형태. 45개 전부 합쳐 73KB라 쪼갤 이유가 없다 */
export interface IncarnonEntry extends IncarnonWeapon {
  /** 'Braton' — 위키 페이지명에서 ' Incarnon Genesis'를 뗀 것 */
  name: string;
  /** 어댑터 uniqueName. 재료 상수의 키다 */
  adapter: string;
  /** 어댑터 아이콘. 읽을 때마다 wfcd를 뒤지지 않으려고 같이 저장한다 */
  imageName?: string;
}

/** 커맨드가 바로 그릴 수 있게 재료·썸네일까지 붙인 형태 */
export interface IncarnonDetail extends IncarnonEntry {
  thumbnail?: string;
  materials: { name: string; count: number }[];
}

/** GET api.php?action=query&prop=revisions — 실제 응답을 직접 호출해 확인한 필드 */
export interface WikiRevisionsResponse {
  query?: {
    pages?: {
      title: string;
      /** 페이지가 없으면 revisions 자체가 없다 */
      revisions?: { slots: { main: { content: string } } }[];
    }[];
  };
}
