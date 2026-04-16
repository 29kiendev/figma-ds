// Shared config — token table + mapping

export const FILE_KEY = '113TbvnQIa2HfdjiWuqrBT';

export const TOKENS = {
  '2xs':  { 1280: 10, 1440: 10, 1920: 11 },
  'xs':   { 1280: 11, 1440: 11, 1920: 12 },
  'sm':   { 1280: 11, 1440: 12, 1920: 13 },
  'base': { 1280: 13, 1440: 14, 1920: 16 },
  'md':   { 1280: 14, 1440: 15, 1920: 17 },
  'lg':   { 1280: 16, 1440: 16, 1920: 18 },
  'xl':   { 1280: 18, 1440: 20, 1920: 22 },
  '2xl':  { 1280: 22, 1440: 24, 1920: 28 },
};

// Map từ font size hiện tại (px) → tên token
// Chỉ áp dụng cho font Arial, bỏ qua 8px và 9px
export const SIZE_TO_TOKEN = {
  10: '2xs', 11: 'xs',  12: 'sm',  13: 'base',
  14: 'md',  15: 'md',  16: 'lg',  17: 'lg',
  18: 'xl',  20: 'xl',  22: '2xl', 24: '2xl', 28: '2xl',
};

export const COLLECTION_NAME = 'Font Size';
export const MODES = [1280, 1440, 1920];
export const TARGET_FONT = 'Arial';
export const SKIP_SIZES = new Set([8, 9]);
export const SOURCE_FRAME_NAME = '1280';
