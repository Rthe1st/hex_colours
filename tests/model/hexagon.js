import test from 'ava';

import {Hexagon} from '../../source/models/hexagon.js';

let mockBoard = {};

test('constructor', t => {
    t.throws(() => {
        new Hexagon("-19:20:4:1:0", {x: 1, y: 2}, mockBoard);
    });
    t.throws(() => {
        new Hexagon("-19:20:4:1:0:1:2", {x: 1, y: 2}, mockBoard);
    });
});

test('sidesAsString', t => {
    t.is(new Hexagon('0:1:2:0:2:1', {x: 0, y: 0}, mockBoard).sidesAsString(), '0:1:2:0:2:1');
    t.is(new Hexagon('0:1:2:0:2:1', {x: 1, y: 2}, mockBoard).sidesAsString(), '0:1:2:0:2:1');
    t.is(new Hexagon('0:0:0:0:0:0', {x: 1, y: 2}, mockBoard).sidesAsString(), '0:0:0:0:0:0');
    t.is(new Hexagon('2:0:1:1:0:1', {x: 1, y: 2}, mockBoard).sidesAsString(), '2:0:1:1:0:1');
});

test('rotation', t => {
    let hexagon = new Hexagon('0:1:2:0:2:1', {x: 0, y: 0}, mockBoard);
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
