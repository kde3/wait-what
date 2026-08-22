// 제시어 뱅크 — 다국어 병기. 정답 판정은 어느 언어로 맞혀도 인정된다.
// 추가 언어 번역은 lib/locales/*.js의 words 배열(같은 순서)에서 병합된다.
import { words as esWords } from './locales/es';
import { words as ptWords } from './locales/pt';
import { words as frWords } from './locales/fr';
import { words as deWords } from './locales/de';
import { words as ruWords } from './locales/ru';
import { words as viWords } from './locales/vi';
import { words as thWords } from './locales/th';
import { words as idWords } from './locales/id';

export const WORDS = [
  { ko: '고양이', en: 'cat', ja: '猫', zh: '猫' },
  { ko: '우주비행사', en: 'astronaut', ja: '宇宙飛行士', zh: '宇航员' },
  { ko: '라면', en: 'ramen', ja: 'ラーメン', zh: '拉面' },
  { ko: '롤러코스터', en: 'roller coaster', ja: 'ジェットコースター', zh: '过山车' },
  { ko: '해적선', en: 'pirate ship', ja: '海賊船', zh: '海盗船' },
  { ko: '무지개', en: 'rainbow', ja: '虹', zh: '彩虹' },
  { ko: '로봇', en: 'robot', ja: 'ロボット', zh: '机器人' },
  { ko: '공룡', en: 'dinosaur', ja: '恐竜', zh: '恐龙' },
  { ko: '눈사람', en: 'snowman', ja: '雪だるま', zh: '雪人' },
  { ko: '마법사', en: 'wizard', ja: '魔法使い', zh: '魔法师' },
  { ko: '유령', en: 'ghost', ja: '幽霊', zh: '幽灵' },
  { ko: '피자', en: 'pizza', ja: 'ピザ', zh: '披萨' },
  { ko: '잠수함', en: 'submarine', ja: '潜水艦', zh: '潜水艇' },
  { ko: '등대', en: 'lighthouse', ja: '灯台', zh: '灯塔' },
  { ko: '열기구', en: 'hot air balloon', ja: '気球', zh: '热气球' },
  { ko: '폭포', en: 'waterfall', ja: '滝', zh: '瀑布' },
  { ko: '사막', en: 'desert', ja: '砂漠', zh: '沙漠' },
  { ko: '빙산', en: 'iceberg', ja: '氷山', zh: '冰山' },
  { ko: '화산', en: 'volcano', ja: '火山', zh: '火山' },
  { ko: '미로', en: 'maze', ja: '迷路', zh: '迷宫' },
  { ko: '천사', en: 'angel', ja: '天使', zh: '天使' },
  { ko: '드래곤', en: 'dragon', ja: 'ドラゴン', zh: '龙' },
  { ko: '인어', en: 'mermaid', ja: '人魚', zh: '美人鱼' },
  { ko: '카멜레온', en: 'chameleon', ja: 'カメレオン', zh: '变色龙' },
  { ko: '펭귄', en: 'penguin', ja: 'ペンギン', zh: '企鹅' },
  { ko: '문어', en: 'octopus', ja: 'タコ', zh: '章鱼' },
  { ko: '나비', en: 'butterfly', ja: '蝶', zh: '蝴蝶' },
  { ko: '선인장', en: 'cactus', ja: 'サボテン', zh: '仙人掌' },
  { ko: '케이크', en: 'cake', ja: 'ケーキ', zh: '蛋糕' },
  { ko: '축구', en: 'soccer', ja: 'サッカー', zh: '足球' },
  { ko: '서커스', en: 'circus', ja: 'サーカス', zh: '马戏团' },
  { ko: '도서관', en: 'library', ja: '図書館', zh: '图书馆' },
  { ko: '놀이공원', en: 'amusement park', ja: '遊園地', zh: '游乐园' },
  { ko: '우산', en: 'umbrella', ja: '傘', zh: '雨伞' },
  { ko: '시계탑', en: 'clock tower', ja: '時計塔', zh: '钟楼' },
  { ko: '캠핑', en: 'camping', ja: 'キャンプ', zh: '露营' },
  { ko: '낚시', en: 'fishing', ja: '釣り', zh: '钓鱼' },
  { ko: '자전거', en: 'bicycle', ja: '自転車', zh: '自行车' },
  { ko: '헬리콥터', en: 'helicopter', ja: 'ヘリコプター', zh: '直升机' },
  { ko: '바이올린', en: 'violin', ja: 'バイオリン', zh: '小提琴' },
];

const EXTRA_WORDS = {
  es: esWords,
  pt: ptWords,
  fr: frWords,
  de: deWords,
  ru: ruWords,
  vi: viWords,
  th: thWords,
  id: idWords,
};

for (const [lang, list] of Object.entries(EXTRA_WORDS)) {
  WORDS.forEach((w, i) => {
    if (list?.[i]) w[lang] = list[i];
  });
}

export function wordText(word, lang) {
  if (!word) return '';
  return word[lang] ?? word.en ?? word.ko;
}
