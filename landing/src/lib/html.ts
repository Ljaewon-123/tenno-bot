// 컴포넌트가 문자열 템플릿으로 직접 태그를 이어 붙이면 XSS/이스케이프 누락이 생기기 쉬움 —
// html``만 거치게 강제하고, 원시 마크업은 raw()로 명시적으로만 통과시킨다.

const RAW = Symbol('raw');

/**
 * raw()로 감싸거나 html``이 반환한 값은 이스케이프 없이 그대로 삽입된다.
 * 순수 문자열을 반환하면 "중첩 html``을 다시 이스케이프하지 않는다"를 구현할 방법이 없어서
 * (원본 유저 문자열과 이미 안전한 문자열을 값만으로는 구별 못 함) 표식이 있는 래퍼를 쓴다.
 * 컴포넌트/페이지는 이 타입을 문자열처럼 조합하다가 최종 출력에서만 String()으로 풀면 된다.
 */
export interface RawHtml {
  [RAW]: true;
  toString(): string;
}

function isRawHtml(value: unknown): value is RawHtml {
  return typeof value === 'object' && value !== null && RAW in value;
}

function makeRaw(value: string): RawHtml {
  return { [RAW]: true, toString: () => value };
}

/** 이미 안전하다고 확인된 마크업(다른 컴포넌트 호출 결과 등)을 이스케이프 없이 삽입할 때 사용. */
export function raw(value: string): RawHtml {
  return makeRaw(value);
}

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

type Interpolation = string | number | boolean | null | undefined | RawHtml | Interpolation[];

function render(value: Interpolation): string {
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  if (isRawHtml(value)) return value.toString();
  return escape(String(value));
}

/**
 * HTML을 조립하는 유일한 통로. 보간값은 기본적으로 이스케이프되고,
 * 배열은 각 원소를 이스케이프해 이어 붙이며, raw()/html`` 결과는 그대로 통과한다.
 */
export function html(strings: TemplateStringsArray, ...values: Interpolation[]): RawHtml {
  let out = strings[0];
  values.forEach((value, i) => {
    out += render(value) + strings[i + 1];
  });
  return makeRaw(out);
}
