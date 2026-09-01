'use strict';

const assert = require('assert');
const {
  HOME_PRIORITY_VERSION,
  HOME_PRIORITY_WEIGHTS,
  HOME_PRIORITY_ITEMS,
  HOME_PRIORITY_RANKING,
  calculatePriorityScore,
  sortByPriority,
} = require('../data/home-priority');

assert.match(HOME_PRIORITY_VERSION, /^\d{4}-\d{2}-\d{2}$/);

const weightTotal = Object.values(HOME_PRIORITY_WEIGHTS).reduce(
  (total, value) => total + value,
  0
);
assert(Math.abs(weightTotal - 1) < Number.EPSILON, 'Priority weights must total 1');

for (const item of Object.values(HOME_PRIORITY_ITEMS)) {
  assert(item.score >= 0 && item.score <= 100, `${item.id} score is out of range`);
  assert.strictEqual(item.score, calculatePriorityScore(item), `${item.id} score drifted`);
  assert(item.evidence.length >= 30, `${item.id} needs an evidence note`);
}

assert.deepStrictEqual(
  HOME_PRIORITY_RANKING.slice(0, 5).map((item) => item.id),
  [
    'type16-test',
    'type16-compatibility',
    'quiz:oshikatsu-type',
    'type16-guide',
    'fortune:ketsueki',
  ],
  'Top five homepage priorities changed unexpectedly'
);

assert.deepStrictEqual(
  sortByPriority(
    [
      { id: 'jinsei-balance-game' },
      { id: 'kakure-chara' },
      { id: 'oshikatsu-type' },
      { id: 'honto-no-seikaku' },
    ],
    (quiz) => `quiz:${quiz.id}`
  ).map((quiz) => quiz.id),
  ['oshikatsu-type', 'honto-no-seikaku', 'kakure-chara', 'jinsei-balance-game'],
  'Quiz cards are not sorted by the priority model'
);

assert.deepStrictEqual(
  sortByPriority(
    [{ id: 'shichuu' }, { id: 'meimei' }, { id: 'ketsueki' }],
    (tool) => `fortune:${tool.id}`
  ).map((tool) => tool.id),
  ['ketsueki', 'shichuu', 'meimei'],
  'Fortune cards are not sorted by the priority model'
);

console.log(
  `PASS: homepage priority ${HOME_PRIORITY_VERSION}; top score ${HOME_PRIORITY_RANKING[0].score}.`
);
