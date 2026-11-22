import {makeRound, replaceTile} from './engine.js';
const $ = id => document.getElementById(id);
const state = {round: null, number: 0, generation: 0, open: false, audio: false, verifying: false};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = '<span class="tile-check" aria-hidden="true"></span>';
function paintImage(button, tile) {
  const image = button.querySelector('.tile-photo');
  const index = Number(button.dataset.index);
  if (state.round.split) {
    image.style.backgroundImage = `url('assets/${state.round.scene}')`;
    image.style.backgroundSize = '400% 400%';
    image.style.backgroundPosition = `${(index % 4) * 100 / 3}% ${Math.floor(index / 4) * 100 / 3}%`;
  } else {
    image.style.backgroundImage = `url('assets/${tile.image}')`;
    image.style.backgroundSize = '100% 100%';
    image.style.backgroundPosition = 'center';
  }
  button.classList.toggle('selected', tile.selected && !state.round.dynamic);
  button.classList.toggle('dynamic-selected', tile.busy);
  button.setAttribute('aria-pressed', String(tile.selected));
  const label = state.round.split ? `Square ${index + 1}, row ${Math.floor(index / state.round.size) + 1}, column ${index % state.round.size + 1}` : `Image ${index + 1}`;
  button.setAttribute('aria-label', `${label}${tile.selected ? ', selected' : ''}${tile.busy ? ', loading replacement' : ''}`);
}
function updateVerify() {
  $('verify').disabled = state.verifying || Boolean(state.round?.tiles.some(tile => tile.busy));
  $('verify').setAttribute('aria-busy', String(state.verifying));
  if (!state.verifying) $('verify').textContent = state.audio || state.round?.dynamic || state.round?.tiles.some(tile => tile.selected) ? 'VERIFY' : 'SKIP';
}
function newRound({error = false, advance = true} = {}) {
  state.generation++;
  if (advance) state.number++;
  state.round = makeRound(state.number);
  state.verifying = false;
  $('target').textContent = state.round.target;
  document.querySelector('.prompt').textContent = state.round.split ? 'Select all squares with' : 'Select all images with';
  $('instructions').textContent = state.round.dynamic ? 'Click verify once there are none left.' : 'If there are none, click skip.';
  $('grid').classList.toggle('split-grid', state.round.split);
  $('grid').setAttribute('aria-label', state.round.split ? `One street photo divided into ${state.round.size} by ${state.round.size} selectable squares` : 'Image choices');
  $('error').hidden = !error;
  $('error').textContent = 'Please try again.';
  $('grid').replaceChildren(...state.round.tiles.map((tile, index) => {
    const button = document.createElement('button');
    button.className = 'tile';
    button.dataset.index = index;
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<span class="tile-photo" aria-hidden="true"></span>' + check;
    paintImage(button, tile);
    button.addEventListener('click', () => chooseTile(index, button));
    return button;
  }));
  $('verify').textContent = 'VERIFY';
  updateVerify();
}
async function chooseTile(index, button) {
  if (!state.open || state.verifying) return;
  const tile = state.round.tiles[index];
  if (tile.busy) return;
  if (!state.round.dynamic) {
    tile.selected = !tile.selected;
    paintImage(button, tile);
    updateVerify();
    return;
  }
  const generation = state.generation;
  tile.selected = true;
  tile.busy = true;
  paintImage(button, tile);
  updateVerify();
  await wait(2000 + Math.random() * 500);
  if (generation !== state.generation || !state.open) return;
  replaceTile(state.round, index);
  paintImage(button, tile);
  updateVerify();
}
async function openChallenge() {
  if (state.open) return;
  $('start').disabled = true;
  $('checkbox').classList.add('loading');
  await wait(650);
  state.open = true;
  state.audio = false;
  state.number = 0;
  $('image-view').hidden = false;
  $('audio-view').hidden = true;
  newRound({advance:false});
  $('layer').hidden = false;
  $('checkbox').classList.remove('loading');
  $('start').disabled = false;
  $('grid').querySelector('button').focus({preventScroll:true});
}
function closeChallenge() {
  state.open = false;
  state.generation++;
  state.verifying = false;
  $('layer').hidden = true;
  $('info-box').hidden = true;
  $('info').setAttribute('aria-expanded','false');
  window.speechSynthesis?.cancel();
  $('start').focus({preventScroll:true});
}
async function verify() {
  if (state.verifying || $('verify').disabled) return;
  state.verifying = true;
  const generation = state.generation;
  updateVerify();
  await wait(800);
  if (generation !== state.generation || !state.open) return;
  if (state.audio) {
    state.verifying = false;
    $('error').textContent = 'Please try again.';
    $('error').hidden = false;
    $('audio-answer').value = '';
    $('verify').textContent = 'VERIFY';
    updateVerify();
    $('audio-answer').focus();
  } else {
    newRound({error:true});
    $('verify').focus({preventScroll:true});
  }
}
$('start').addEventListener('click', openChallenge);
$('verify').addEventListener('click', verify);
$('refresh').addEventListener('click', () => {
  window.speechSynthesis?.cancel();
  newRound();
  $('audio-answer').value = '';
});
$('audio').addEventListener('click', () => {
  state.audio = !state.audio;
  window.speechSynthesis?.cancel();
  newRound({advance:false});
  $('image-view').hidden = state.audio;
  $('audio-view').hidden = !state.audio;
  $('audio').setAttribute('aria-label', state.audio ? 'Get an image challenge' : 'Get an audio challenge');
  $('audio').title = state.audio ? 'Get an image challenge' : 'Get an audio challenge';
  if (state.audio) $('play-audio').focus();
});
$('play-audio').addEventListener('click', () => {
  if (!('speechSynthesis' in window)) {
    $('error').textContent = 'Audio is unavailable. Please try the image challenge.';
    $('error').hidden = false;
    return;
  }
  window.speechSynthesis.cancel();
  const digits = Array.from({length:6}, () => Math.floor(Math.random()*10)).join('. ');
  const utterance = new SpeechSynthesisUtterance(digits);
  utterance.lang = 'en-US';
  utterance.rate = .6;
  window.speechSynthesis.speak(utterance);
});
$('audio-answer').addEventListener('keydown', event => {if(event.key === 'Enter') verify();});
$('info').addEventListener('click', () => {
  $('info-box').hidden = !$('info-box').hidden;
  $('info').setAttribute('aria-expanded', String(!$('info-box').hidden));
  if (!$('info-box').hidden) $('info-box').scrollIntoView({block:'nearest'});
});
$('layer').addEventListener('click', event => {if(event.target === $('layer')) closeChallenge();});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.open) closeChallenge();
  if (event.key === 'Tab' && state.open) {
    const focusable = [...$('challenge').querySelectorAll('button:not(:disabled), input')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  }
});
document.querySelectorAll('[data-info]').forEach(button => button.addEventListener('click', () => {
  const privacy = button.dataset.info === 'privacy';
  $('legal-title').textContent = privacy ? 'Privacy' : 'Terms';
  $('legal-text').textContent = privacy ? 'This CAPTCHA parody runs in your browser. Your selections and audio answers are not collected or sent anywhere. No Google CAPTCHA service is used.' : 'NeverCAPTCHA is a joke: verification never succeeds. You can leave whenever you like. This independent parody is not affiliated with Google.';
  $('legal-dialog').showModal();
}));
$('close-legal').addEventListener('click', () => $('legal-dialog').close());
