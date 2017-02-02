import test from 'ava';

import {Hexagon} from '../../source/models/hexagon.js';

test('constructor', t => {
    let sides = [
        {number: -19},{number: 20},{number: 4},
        {number: 1},{number: 0}
    ];
    t.throws(() => {
        new Hexagon({x: 1, y: 2}, sides);
    });
    sides = [
        {number: -19},{number: 20},{number: 4},
        {number: 1},{number: 0}, {number:1}, {number: 2}
    ];
    t.throws(() => {
        new Hexagon({x: 1, y: 2}, sides);
    });
});

test('sidesAsString', t => {
    let sides = [
        {number: 0},{number: 1},{number: 2},
        {number: 0},{number: 2},{number: 1}
    ];
    t.is(new Hexagon({x: 0, y: 0}, sides).sidesAsString(), '0:1:2:0:2:1');
    sides = [
        {number: 0},{number: 1},{number: 2},
        {number: 0},{number: 2},{number: 1}
    ];
    t.is(new Hexagon({x: 1, y: 2}, sides).sidesAsString(), '0:1:2:0:2:1');
    sides = [
        {number: 0},{number: 0},{number: 0},
        {number: 0},{number: 0},{number: 0}
    ];
    t.is(new Hexagon({x: 1, y: 2}, sides).sidesAsString(), '0:0:0:0:0:0');
    sides = [
        {number: -19},{number: 20},{number: 4},
        {number: 1},{number: 0},{number: 23}
    ];
    t.is(new Hexagon({x: 1, y: 2}, sides).sidesAsString(), '-19:20:4:1:0:23');
});

test('rotation', t => {
    let sides = [
        {number: 0},{number: 1},{number: 2},
        {number: 0},{number: 2},{number: 1}
    ];
    let hexagon = new Hexagon({x: 0, y: 0}, sides);
    hexagon.rotate(1);
    t.is(hexagon.sidesAsString(), '1:0:1:2:0:2', "1");
    hexagon.rotate(-1);
    t.is(hexagon.sidesAsString(), '0:1:2:0:2:1', "-1");
    hexagon.rotate(-20);
    t.is(hexagon.sidesAsString(), '2:0:2:1:0:1', "-20");
    hexagon.rotate(4);
    t.is(hexagon.sidesAsString(), '2:1:0:1:2:0', "4");
    hexagon.rotate(3);
    t.is(hexagon.sidesAsString(), '1:2:0:2:1:0', "3");
    hexagon.rotate(-11);
    t.is(hexagon.sidesAsString(), '0:1:2:0:2:1', "-11");
});
