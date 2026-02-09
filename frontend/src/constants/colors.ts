// 태그 색상 팔레트
export const TAG_COLORS = [
  '#EBD8DC', // 연핑크
  '#F5EBC8', // 연노랑
  '#CAD3C0', // 연녹색
  '#D5D5D7', // 연회색
  '#D4E4F1', // 연파랑
  '#F0D8CC', // 연주황
  '#DAD3DB', // 연보라
];

// 태그 이름으로 색상 가져오기 (해시 기반)
export const getTagColor = (tagName: string, customColor?: string): string => {
  if (customColor) return customColor;

  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

// 앱 테마 색상
export const THEME = {
  background: '#F0EFEB',
  cardBg: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(148, 163, 184, 0.3)',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#94a3b8',
  },
  status: {
    solved: '#eab308',
    unsolved: '#94a3b8',
  },
};
