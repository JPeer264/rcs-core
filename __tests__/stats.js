import rcs from '../lib';

beforeEach(() => {
  rcs.selectorsLibrary.reset();
  rcs.cssVariablesLibrary.reset();
  rcs.keyframesLibrary.reset();
});

it('replace js and get correct classes', () => {
  rcs.selectorsLibrary.fillLibrary('#id {} .selector {} .not-used {} .used {}');
  rcs.replace.js('var a = \'.selector .used #id\';');

  const stats = rcs.stats();

  expect(stats.unusedClasses).toEqual(['not-used']);
  expect(stats.unusedIds).toEqual([]);
});

it('replace js and get correct classes and ids', () => {
  rcs.selectorsLibrary.fillLibrary('#id {} .selector {} .not-used {} .used {}');
  rcs.replace.js('var a = ".selector .used";');

  const stats = rcs.stats();

  expect(stats.unusedClasses).toEqual(['not-used']);
  expect(stats.unusedIds).toEqual(['id']);
  expect(stats.classUsageCount).toEqual({ 'not-used': 0, used: 1, selector: 1 });
  expect(stats.idUsageCount).toEqual({ id: 0 });
});

// following should pass after issue #51 is resolved
it('replace html and get correct classes and ids', () => {
  rcs.selectorsLibrary.fillLibrary('#id {} .selector {} .not-used {} .used {}');
  rcs.replace.html('<div class="selector id used"></div>');

  const stats = rcs.stats();

  expect(stats.unusedClasses).toEqual(['not-used']);
  expect(stats.unusedIds).toEqual(['id']);
  expect(stats.classUsageCount).toEqual({ 'not-used': 0, used: 1, selector: 1 });
  expect(stats.idUsageCount).toEqual({ id: 0 });
});

it('replace html and get correct classes and ids', () => {
  rcs.selectorsLibrary.fillLibrary('#id {} .selector {} .not-used {} .used {}');
  rcs.replace.html('<div class="selector used"></div>');

  const stats = rcs.stats();

  expect(stats.unusedClasses).toEqual(['not-used']);
  expect(stats.unusedIds).toEqual(['id']);
  expect(stats.classUsageCount).toEqual({ 'not-used': 0, used: 1, selector: 1 });
  expect(stats.idUsageCount).toEqual({ id: 0 });
});

it('replace css and get correct classes and ids', () => {
  rcs.selectorsLibrary.fillLibrary('#id {} .selector {} .not-used {} .used {}');
  rcs.replace.css('#id {} .selector {} .used {}');

  const stats = rcs.stats();

  expect(stats.unusedClasses).toEqual(['not-used']);
  expect(stats.unusedIds).toEqual([]);
  expect(stats.classUsageCount).toEqual({ 'not-used': 0, used: 1, selector: 1 });
  expect(stats.idUsageCount).toEqual({ id: 1 });
});

it('replace all and get correct classes and ids', () => {
  rcs.selectorsLibrary.fillLibrary('#id {} .selector {} .not-used {} .used {}');
  rcs.replace.css('#id {} .selector {} .used {}');
  rcs.replace.html('<div class="selector used"></div>');
  rcs.replace.js('var a = "used";');

  const stats = rcs.stats();

  expect(stats.unusedClasses).toEqual(['not-used']);
  expect(stats.unusedIds).toEqual([]);
  expect(stats.classUsageCount).toEqual({ 'not-used': 0, used: 3, selector: 2 });
  expect(stats.idUsageCount).toEqual({ id: 1 });
});


it('replace all and get correct classes and ids with all matching css variables', () => {
  rcs.selectorsLibrary.fillLibrary('#id {} .selector {} .not-used {} .used {}');
  rcs.cssVariablesLibrary.fillLibrary('.test { --my-variable: #BADA55; }');
  rcs.replace.css('#id {} .selector { color: var(--my-variable) } .used {}');
  rcs.replace.html('<div class="selector used"></div>');
  rcs.replace.js('var a = "used";');

  const stats = rcs.stats();

  expect(stats.unusedClasses).toEqual(['not-used']);
  expect(stats.unusedIds).toEqual([]);
  expect(stats.classUsageCount).toEqual({ 'not-used': 0, used: 3, selector: 2 });
  expect(stats.idUsageCount).toEqual({ id: 1 });
  expect(stats.cssVariablesUsageCount).toEqual({ 'my-variable': 1 });
  expect(stats.unusedCssVariables).toEqual([]);
});

it('replace all and get correct classes and ids with css variables', () => {
  rcs.selectorsLibrary.fillLibrary('#id {} .selector {} .not-used {} .used {}');
  rcs.cssVariablesLibrary.fillLibrary('.test { --my-variable: #BADA55; --other-variable: #FB1 }');
  rcs.replace.css('#id {} .selector { color: var(--my-variable) } .used {}');
  rcs.replace.html('<div class="selector used"></div>');
  rcs.replace.js('var a = "used";');

  const stats = rcs.stats();

  expect(stats.unusedClasses).toEqual(['not-used']);
  expect(stats.unusedIds).toEqual([]);
  expect(stats.classUsageCount).toEqual({ 'not-used': 0, used: 3, selector: 2 });
  expect(stats.idUsageCount).toEqual({ id: 1 });
  expect(stats.cssVariablesUsageCount).toEqual({ 'my-variable': 1, 'other-variable': 0 });
  expect(stats.unusedCssVariables).toEqual(['other-variable']);
});

it('replace css and get correct keyframes count', () => {
  const css = '@keyframes move {} @keyframes another-move {} .move { animation: move }';

  rcs.keyframesLibrary.fillLibrary(css);
  rcs.replace.css(css);

  const stats = rcs.stats();

  expect(stats.keyframesUsageCount).toEqual({ 'another-move': 0, move: 1 });
  expect(stats.unusedKeyframes).toEqual(['another-move']);
});
