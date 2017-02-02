import test from 'ava';

import * as gridNavigation from '../source/gridNavigation.js';

test('getAdjacentHexagonOffset', t => {
    t.deepEqual({x: 0, y: -1}, gridNavigation.getAdjacentHexagonOffset(1, 0), "odd x, side 0");
    t.deepEqual({x: 1, y: -1}, gridNavigation.getAdjacentHexagonOffset(1, 1), "odd x, side 1");
    t.deepEqual({x: 1, y: 0}, gridNavigation.getAdjacentHexagonOffset(1, 2), "odd x, side 2");
    t.deepEqual({x: 0, y: 1}, gridNavigation.getAdjacentHexagonOffset(1, 3), "odd y, side 3");
    t.deepEqual({x: -1, y: 0}, gridNavigation.getAdjacentHexagonOffset(1, 4), "odd y, side 4");
    t.deepEqual({x: -1, y: -1}, gridNavigation.getAdjacentHexagonOffset(1, 5), "odd y, side 5");
    t.deepEqual({x: 0, y: -1}, gridNavigation.getAdjacentHexagonOffset(2, 0), "even y, side 0");
    t.deepEqual({x: 1, y: 0}, gridNavigation.getAdjacentHexagonOffset(2, 1), "even y, side 1");
    t.deepEqual({x: 1, y: 1}, gridNavigation.getAdjacentHexagonOffset(2, 2), "even y, side 2");
    t.deepEqual({x: 0, y: 1}, gridNavigation.getAdjacentHexagonOffset(2, 3), "even y, side 3");
    t.deepEqual({x: -1, y: 1}, gridNavigation.getAdjacentHexagonOffset(2, 4), "even y, side 4");
    t.deepEqual({x: -1, y: 0}, gridNavigation.getAdjacentHexagonOffset(2, 5), "even y, side 5");
});
