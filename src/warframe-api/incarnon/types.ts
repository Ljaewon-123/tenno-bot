/** wiki.warframe.com Incarnon Genesis 페이지 Evolutions 표 파싱 결과 */

export interface IncarnonPerk {
  name: string;
  /** 위키 File: 이름 */
  icon: string;
  /** 불릿 한 줄이 한 항목. 수치는 최상위 변종 열 기준으로 이미 치환돼 있다 */
  effect: string[];
}

export interface IncarnonTier {
  evolution: number;
  /** 표에서 이전 티어 뒤에 놓인 행이라 한 칸 당겨 붙인다. EVO1은 없다 */
  challenge?: string;
  perks: IncarnonPerk[];
}

/** 설치 재료 한 줄. 이름·아이콘은 uniqueName으로 wfcd에서 붙인다 */
export interface IncarnonMaterial {
  uniqueName: string;
  count: number;
}

export interface IncarnonWeapon {
  /** 수치 기준 열의 변종 이름. 변종 열이 없는 페이지는 undefined */
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

export interface IncarnonDetail extends IncarnonEntry {
  thumbnail?: string;
  materials: { name: string; count: number }[];
}

/** GET api.php?action=query&prop=revisions */
export interface WikiRevisionsResponse {
  query?: {
    pages?: {
      title: string;
      /** 페이지가 없으면 revisions 자체가 없다 */
      revisions?: { slots: { main: { content: string } } }[];
    }[];
  };
}
