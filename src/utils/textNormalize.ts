// 标点符号 + 各类符号清理（包括全角/半角）
const PUNCTUATION_REGEX = /[\p{P}\p{S}\s]+/gu;

/**
 * 文本归一化：去除空白、标点、连续重复字符
 */
export function normalizeText(input: string): string {
  if (!input) return '';
  let s = toHalfwidth(input.trim().toLowerCase());
  s = s.replace(PUNCTUATION_REGEX, '');
  s = removeConsecutiveDuplicates(s);
  return s;
}

/**
 * 全角转半角
 */
export function toHalfwidth(input: string): string {
  return input.replace(/[\uFF01-\uFF5E]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

/**
 * 拆分字符（正确处理 Unicode 代理对，例如 emoji、罕见汉字）
 */
export function splitChars(input: string): string[] {
  return Array.from(input);
}

/**
 * 去除连续重复字符（例：开开开心 -> 开心）
 */
function removeConsecutiveDuplicates(input: string): string {
  let result = '';
  for (const char of input) {
    if (result.length === 0 || result[result.length - 1] !== char) {
      result += char;
    }
  }
  return result;
}
