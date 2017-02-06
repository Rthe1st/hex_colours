import test from 'ava';

import * as score from '../source/score.js';
import {Board} from '../source/models/board.js';
import * as teamInfo from '../source/teamInfo.js';

let mockGui = {add: () => {}};

test('score', t => {
    t.is(score.getConnectionSet({x: 0, y: 0, side: 0}, teamInfo.teams[1], new Board('1:1:1:1:1:1', 'normal', mockGui)).combinedSides.size, 6);
    t.is(score.getConnectionSet({x: 0, y: 0, side: 0}, teamInfo.teams[0], new Board('1:1:1:1:1:1', 'normal', mockGui)).combinedSides.size, 0);
    t.is(score.getConnectionSet({x: 0, y: 0, side: 0}, teamInfo.teams[1], new Board('1:1:0:0:0:0', 'normal', mockGui)).combinedSides.size, 2);
    t.is(score.getConnectionSet({x: 0, y: 0, side: 0}, teamInfo.teams[1], new Board('1:0:1:0:1:0', 'normal', mockGui)).combinedSides.size, 1);
});
