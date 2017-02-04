import test from 'ava';

import {CombinedSide} from '../../source/models/combinedSide.js';

const boardMock = {
    getHex: function(x, y){
        return {side: 0};
    }
};

test('constructor', t => {
    const cords = {x: 0, y: 0, side:0};
    t.notThrows(() => {
        new CombinedSide(cords, boardMock);
    });
    let badBoardMock = {
        getHex: function(x, y){
            return undefined;
        }
    };
    t.throws(() => {
        new CombinedSide(cords, badBoardMock);
    });
});

test('equals', t => {
    const cords = {x: 0, y: 0, side:0};
    const combinedSide = new CombinedSide(cords, boardMock);
    t.true(combinedSide.equals({x: 0, y: 0, side: 0}));
    t.true(combinedSide.equals({x: 0, y: -1, side: 3}));
});
test('alternativeCords', t => {
    let cords = {x: 0, y: 0, side:0};
    let combinedSide = new CombinedSide(cords, boardMock);
    t.deepEqual(combinedSide.alternativeCords, {x: 0, y: -1, side: 3});
    cords = {x: 0, y: -1, side: 3};
    combinedSide = new CombinedSide(cords, boardMock);
    t.deepEqual(combinedSide.alternativeCords, {x: 0, y: 0, side:0});
});
