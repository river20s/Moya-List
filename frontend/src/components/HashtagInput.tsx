import { useRef } from 'react';
import { splitByHashtags } from '../utils/parseHashtags';

interface HashtagInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * #태그명을 실시간으로 하이라이팅하는 텍스트 입력 컴포넌트.
 *
 * 구현 방식 (오버레이):
 * - wrapper div (position: relative)
 *   ├── overlay div  : 하이라이팅된 텍스트를 렌더링 (pointer-events: none)
 *   └── input        : 실제 입력 받는 레이어 (text: transparent, caret는 보임)
 *
 * input에서 스크롤이 발생하면 overlay도 동일한 scrollLeft로 동기화해서
 * 텍스트 오버플로우 상황에서도 두 레이어가 항상 일치한다.
 */
function HashtagInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className = '',
  autoFocus = false,
}: HashtagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // input이 스크롤될 때 overlay를 동일한 위치로 동기화
  const syncScroll = () => {
    if (inputRef.current && overlayRef.current) {
      overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  const parts = splitByHashtags(value);

  return (
    <div className={`relative ${className}`}>
      {/* 오버레이: 하이라이팅 텍스트 레이어 */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="
          absolute inset-0
          px-4 py-3
          text-sm text-slate-800
          whitespace-pre overflow-hidden
          pointer-events-none
          rounded-xl
        "
      >
        {parts.map((part, i) =>
          part.startsWith('#') && part.length > 1 ? (
            <span key={i} className="text-blue-500 underline underline-offset-2">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        {/* 빈 문자열일 때 높이 유지용 */}
        {value.length === 0 && <span>&nbsp;</span>}
      </div>

      {/* 실제 input: 텍스트는 투명하지만 커서(caret)는 보임 */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        onKeyUp={syncScroll}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="
          relative w-full
          px-4 py-3
          bg-transparent
          text-sm text-transparent caret-slate-800
          border border-slate-300/50 rounded-xl
          focus:outline-none focus:border-slate-400
          transition-all
          placeholder:text-slate-400
        "
      />
    </div>
  );
}

export default HashtagInput;
