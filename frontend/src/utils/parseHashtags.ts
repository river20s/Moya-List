/**
 * 입력 문자열에서 #태그명 토큰을 추출한다.
 *
 * 규칙:
 * - `#` 뒤에 오는 공백/`#` 이외의 문자열을 태그로 인식
 * - 공백 없이 붙여 써도 각각 인식: "#React#hooks" → ["React", "hooks"]
 * - 태그 토큰은 제목에서 제거하고 앞뒤 공백을 정리한다
 *
 * 예시:
 *   "React useState가 뭐야 #React #hooks"
 *   → { cleanTitle: "React useState가 뭐야", tagNames: ["React", "hooks"] }
 */
export function parseHashtags(text: string): { cleanTitle: string; tagNames: string[] } {
  const tagNames: string[] = [];
  const tagRegex = /#([^\s#]+)/g;

  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    tagNames.push(match[1]);
  }

  const cleanTitle = text
    .replace(/#[^\s#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { cleanTitle, tagNames };
}

/**
 * 텍스트를 일반 부분과 #태그 부분으로 분리한다. (하이라이팅용)
 *
 * `[^\s#]+` 를 사용해 공백 없이 붙인 태그도 각각 분리한다.
 *
 * 예시:
 *   "뭐야 #React #hooks"  → ["뭐야 ", "#React", " ", "#hooks"]
 *   "뭐야 #React#hooks"   → ["뭐야 ", "#React", "#hooks"]
 */
export function splitByHashtags(text: string): string[] {
  return text.split(/(#[^\s#]+)/g).filter((part) => part.length > 0);
}
