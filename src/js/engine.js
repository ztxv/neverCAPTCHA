import {PHOTO_POOLS} from './photos.js';
export const CAR_IMAGES = PHOTO_POOLS.cars;
export const BICYCLE_IMAGES = PHOTO_POOLS.bicycles;
export const OTHER_IMAGES = PHOTO_POOLS.other;
export const HYDRANT_IMAGES = PHOTO_POOLS['fire hydrants'];
export const MOTORCYCLE_IMAGES = PHOTO_POOLS.motorcycles;
export const CATEGORIES = {
  cars: CAR_IMAGES,
  bicycles: BICYCLE_IMAGES,
  'fire hydrants': HYDRANT_IMAGES,
  motorcycles: MOTORCYCLE_IMAGES,
};
export const ROUND_TYPES = [
  {target: 'motorcycles', split: true, scenes: ['scenes/motorcycle-0.png','scenes/motorcycle-1.png','scenes/motorcycle-2.png','scenes/motorcycle-3.png','scenes/motorcycle-4.png','scenes/motorcycle-5.png','scenes/bicycle-0.png']},
  {target: 'fire hydrants'},
  {target: 'cars', dynamic: true},
  {target: 'motorcycles'},
  {target: 'bicycles', split: true, scenes: ['scenes/bicycle-1.png','scenes/bicycle-2.png','scenes/bicycle-3.png','scenes/bicycle-4.png','scenes/bicycle-5.png']},
  {target: 'bicycles'},
  {target: 'motorcycles', dynamic: true},
  {target: 'fire hydrants', dynamic: true},
  {target: 'traffic lights', split: true, scenes: ['scenes/traffic-light-0.png','scenes/traffic-light-1.png','scenes/traffic-light-2.png','scenes/traffic-light-3.png','scenes/traffic-light-4.png','scenes/traffic-light-5.png']},
  {target: 'crosswalks', split: true, scenes: ['scenes/crosswalk-0.png']},
];
export const pick = (items, random = Math.random) => items[Math.floor(random() * items.length)];
export function makeRound(number, random = Math.random) {
  const type = ROUND_TYPES[number % ROUND_TYPES.length];
  if (type.split) return {
    number, target: type.target, dynamic: false, split: true, size: 4, scene: pick(type.scenes, random),
    tiles: Array.from({length: 16}, () => ({selected: false, busy: false})),
  };
  const targets = CATEGORIES[type.target];
  const distractors = [...Object.values(CATEGORIES).flat(), ...OTHER_IMAGES].filter(image => !targets.includes(image));
  const availableTargets = [...targets], availableDistractors = [...distractors];
  const tiles = Array.from({length: 9}, (_, i) => {
    const pool = i < 4 ? availableTargets : availableDistractors;
    const image = pool.splice(Math.floor(random() * pool.length), 1)[0];
    return {image, selected: false, busy: false};
  });
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return {number, dynamic: Boolean(type.dynamic), split: false, size: 3, target: type.target, targets, distractors, tiles};
}
export function replaceTile(round, index, random = Math.random) {
  if (!round.dynamic) throw new Error('Only dynamic image rounds replace tiles');
  const tile = round.tiles[index];
  const otherTargets = round.tiles.some((item, i) => i !== index && round.targets.includes(item.image));
  const candidates = otherTargets && random() < .22 ? round.distractors : round.targets;
  const visible = round.tiles.map(item => item.image);
  const uniqueCandidates = candidates.filter(image => !visible.includes(image));
  tile.image = pick(uniqueCandidates.length ? uniqueCandidates : candidates.filter(image => image !== tile.image), random);
  tile.selected = false;
  tile.busy = false;
  return tile;
}
