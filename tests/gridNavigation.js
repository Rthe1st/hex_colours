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

test('oppositeHexagon', t => {
    t.deepEqual(new gridNavigation.CombinedSideCord(1, 0, 3), gridNavigation.oppositeHexagon(new gridNavigation.CombinedSideCord(1,1,0)), "");
    t.deepEqual(new gridNavigation.CombinedSideCord(2, 1, 1), gridNavigation.oppositeHexagon(new gridNavigation.CombinedSideCord(3,1,4)), "");
    t.deepEqual(new gridNavigation.CombinedSideCord(5, 3, 5), gridNavigation.oppositeHexagon(new gridNavigation.CombinedSideCord(4, 2, 2)), "");
    let examples = [
        {x: 1, y: 1},
        {x: 2, y: 1},
        {x: 500, y: 245}/*,
        {x: -10, y: 30},
        {x: 10, y: -20}*/
    ];
    for(let example of examples){
        for(let side = 0; side <= 5; side++){
            let combinedSideCord = new gridNavigation.CombinedSideCord(example.x, example.y, side);
            t.deepEqual(combinedSideCord, new gridNavigation.oppositeHexagon(gridNavigation.oppositeHexagon(combinedSideCord)), "opposite of opposite should be the orignal");
        }
    }
});
