(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _lazyDesignJs = require("./lazyDesign.js");

var CombinedSide = (function () {
    function CombinedSide(game, hexagonInfos) {
        _classCallCheck(this, CombinedSide);

        if (hexagonInfos.length !== 1 && hexagonInfos.length !== 2) {
            console.log("combined side expects to combine 1 or 2 hexagons, not: ".hexagonInfos.length);
        }
        this.hexagonInfos = hexagonInfos;
        this.graphics = game.add.graphics(hexagonInfos[0].hexagon.worldCords.x, hexagonInfos[0].hexagon.worldCords.y);
    }

    //this parameter is pretty gross

    _createClass(CombinedSide, [{
        key: "draw",
        value: function draw(hexPoints) {
            this.graphics.clear();
            var colour1 = _lazyDesignJs.teams[this.hexagonInfos[0].hexagon.sides[this.hexagonInfos[0].side]].colour;
            if (this.hexagonInfos.length === 1) {
                this.graphics.lineStyle(10, colour1, 100);
            } else {
                var colour2 = _lazyDesignJs.teams[this.hexagonInfos[1].hexagon.sides[this.hexagonInfos[1].side]].colour;
                this.graphics.lineStyle(10, this.colourCombinations(colour1, colour2));
            }
            var start = hexPoints[this.hexagonInfos[0].side];
            this.graphics.moveTo(start.x, start.y);
            var end = hexPoints[(this.hexagonInfos[0].side + 1) % 6];
            //keep this as possible alternative, cause it looked cool
            //probably be better if this was done on the hexagon sides and combine sides ignore in that mode
            //let end = hexPoints[this.hexagonInfos[1].side];
            this.graphics.lineTo(end.x, end.y);
        }
    }, {
        key: "colourCombinations",
        value: function colourCombinations(colour1, colour2) {
            var coloursToCombine = [colour1, colour2];
            if (colour1 === colour2) {
                return colour1;
            } else if (coloursToCombine.includes(_lazyDesignJs.colours.get("red")) && coloursToCombine.includes(_lazyDesignJs.colours.get("yellow"))) {
                return _lazyDesignJs.colours.get("orange");
            } else if (coloursToCombine.includes(_lazyDesignJs.colours.get("red")) && coloursToCombine.includes(_lazyDesignJs.colours.get("blue"))) {
                return _lazyDesignJs.colours.get("purple");
            } else if (coloursToCombine.includes(_lazyDesignJs.colours.get("yellow")) && coloursToCombine.includes(_lazyDesignJs.colours.get("blue"))) {
                return _lazyDesignJs.colours.get("green");
            } else {
                console.log("error, not colour combination availible");
                console.log(colour1);
                console.log(colour2);
            }
        }
    }]);

    return CombinedSide;
})();

exports["default"] = CombinedSide;
module.exports = exports["default"];

},{"./lazyDesign.js":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _lazyDesignJs = require("./lazyDesign.js");

var Hexagon = (function () {
    function Hexagon(sideLength, gridCords, spaceFactor, game) {
        _classCallCheck(this, Hexagon);

        this.sideLength = sideLength;
        this.gridCords = gridCords;
        this.game = game;

        var _buildHexagonPolygon = this.buildHexagonPolygon(this.sideLength * spaceFactor);

        var polygon = _buildHexagonPolygon.polygon;

        this.polygon = polygon;
        var hexagonHeight = 2 * Math.sin(Math.PI / 3) * sideLength;
        //plus ones so we don't get cut off by edge of map
        this.worldCords = {
            x: sideLength * (gridCords.x + 1) * 1.5,
            y: hexagonHeight * (gridCords.y + 1)
        };
        if (this.gridCords.x % 2 == 1) {
            this.worldCords.y -= hexagonHeight / 2;
        }
        this.sides = this.assignSides(_lazyDesignJs.teams);
        this.image = game.add.image(this.worldCords.x, this.worldCords.y);
        this.image.inputEnabled = true;
        var hexagon = this;
        //this isn't pixle perfect, so use in conjuction with polygon hit test?
        //assuming box for this testi is too big, not too small
        this.image.events.onInputDown.add(function (s) {
            console.log('clicked');
            hexagon.rotate(1);
            hexagon.dirty = true;
        });
        //check Graphics.generateTexture for performance tip
        this.graphics = new Phaser.Graphics(game, 0, 0);
        this.image.addChild(this.graphics);
        this.buildGraphic();
        this.sideGraphics = new Phaser.Graphics(game, 0, 0);
        this.image.addChild(this.sideGraphics);
    }

    _createClass(Hexagon, [{
        key: "assignSides",
        value: function assignSides(teams) {
            var sides = [];
            for (var sideNumber = 0; sideNumber < 6; sideNumber++) {
                //for non-random sides
                //sides.push(sideNumber%teams.length);
                //for random sides
                sides.push(Math.floor(Math.random() * teams.length));
            }
            return sides;
        }
    }, {
        key: "rotate",
        value: function rotate(amount) {
            amount = amount % 6;
            //for anti-clockwise
            if (amount < 0) {
                amount = 6 - amount;
            }
            for (var i = 0; i < amount; i++) {
                this.sides.unshift(this.sides.pop());
            }
        }
    }, {
        key: "buildHexagonPolygon",
        value: function buildHexagonPolygon(sideLength) {
            var corner_vertical = Math.sin(Math.PI / 3) * sideLength;
            var corner_horizontal = Math.cos(Math.PI / 3) * sideLength;
            var polygon = new Phaser.Polygon(new Phaser.Point(-corner_horizontal, -corner_vertical), new Phaser.Point(+corner_horizontal, -corner_vertical), new Phaser.Point(sideLength, 0), new Phaser.Point(+corner_horizontal, +corner_vertical), new Phaser.Point(-corner_horizontal, +corner_vertical), new Phaser.Point(-sideLength, 0));
            return { polygon: polygon, height: 2 * Math.sin(Math.PI / 3) * sideLength };
        }
    }, {
        key: "drawHexagonSides",
        value: function drawHexagonSides(hexPoints) {
            this.sideGraphics.clear();
            for (var sideNumber = 0; sideNumber < 6; sideNumber++) {
                var colour = _lazyDesignJs.teams[this.sides[sideNumber]].colour;
                this.sideGraphics.lineStyle(5, colour, 100);
                var start = hexPoints[sideNumber];
                this.sideGraphics.moveTo(start.x, start.y);
                var end = hexPoints[(sideNumber + 1) % 6];
                //for "across hex" mode
                //let end = hexPoints[(sideNumber+3)%6];
                this.sideGraphics.lineTo(end.x, end.y);
            }
        }
    }, {
        key: "buildGraphic",
        value: function buildGraphic() {
            this.graphics.clear();
            this.graphics.beginFill(0xFF33ff);
            this.graphics.drawPolygon(this.polygon.points);
            this.graphics.endFill();
            //look at adding this to a group/image class with the graphics object
            var hexagonText = this.game.add.text(this.worldCords.x - 10, this.worldCords.y - 10, this.gridCords.x + "," + this.gridCords.y);
            hexagonText.font = "arial";
            hexagonText.fontSize = 8;
        }
    }]);

    return Hexagon;
})();

exports["default"] = Hexagon;
module.exports = exports["default"];

},{"./lazyDesign.js":3}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var colours = new Map([["red", 0xff0000], ["yellow", 0xebff00], ["blue", 0x0000ff], ["orange", 0xffb000], ["purple", 0xaf00ff], ["green", 0x00ff00]]);

exports.colours = colours;
var teams = [{
    number: 0,
    colour: colours.get("red")
}, {
    number: 1,
    colour: colours.get("yellow")
}, {
    number: 2,
    colour: colours.get("blue")
}];
exports.teams = teams;

},{}],4:[function(require,module,exports){
//if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _hexagonJs = require("./hexagon.js");

var _hexagonJs2 = _interopRequireDefault(_hexagonJs);

var _combinedSideJs = require("./combinedSide.js");

var _combinedSideJs2 = _interopRequireDefault(_combinedSideJs);

function getSpaceHexPoints(sideLength) {
    var corner_vertical = Math.sin(Math.PI / 3) * sideLength;
    var corner_horizontal = Math.cos(Math.PI / 3) * sideLength;
    return [{ x: -corner_horizontal, y: -corner_vertical }, { x: +corner_horizontal, y: -corner_vertical }, { x: sideLength, y: 0 }, { x: +corner_horizontal, y: +corner_vertical }, { x: -corner_horizontal, y: +corner_vertical }, { x: -sideLength, y: 0 }];
}

function getAdjacentHexagonOffset(gridX, side) {
    //even column: odd column:
    //*a*          aaa
    //aha          aha
    //aaa          *a*
    var diagonalYAbove = gridX % 2;
    var diagonalYBelow = gridX % 2 - 1;
    //assumes side 0 is top, increasing clockwise
    var adjacentHexOffset = [{ x: 0, y: -1 }, { x: 1, y: -gridX % 2 }, { x: 1, y: 1 - gridX % 2 }, { x: 0, y: 1 }, { x: -1, y: 1 - gridX % 2 }, { x: -1, y: -gridX % 2 }];
    return adjacentHexOffset[side];
}

function createCombinedLines(game, hexagons) {
    var combinedSides = [];
    for (var x = 0; x < hexagons.length; x++) {
        for (var y = 0; y < hexagons[x].length; y++) {
            var centerHexagon = hexagons[x][y];
            for (var sideNumber = 0; sideNumber < 6; sideNumber++) {
                var hexInfo = [{
                    hexagon: centerHexagon,
                    side: sideNumber
                }];
                var adjacentHexOffset = getAdjacentHexagonOffset(x, sideNumber);
                var hexagon2Coordinates = { x: x + adjacentHexOffset.x, y: y + adjacentHexOffset.y };
                var hexagon2Exists = !(hexagon2Coordinates.x < 0 || hexagon2Coordinates.x >= hexagons.length || hexagon2Coordinates.y < 0 || hexagon2Coordinates.y >= hexagons[x].length);
                if (!hexagon2Exists) {
                    combinedSides.push(new _combinedSideJs2["default"](game, hexInfo));
                } else if (sideNumber < 3) {
                    //sides numbered above 3 are covered whn we iterate over the other hexagon (so we don't create every combine twice)
                    hexInfo.push({
                        hexagon: hexagons[hexagon2Coordinates.x][hexagon2Coordinates.y],
                        side: (sideNumber + 3) % 6
                    });
                    console.log("center hex");
                    console.log(centerHexagon.gridCords);
                    console.log("side: " + sideNumber);
                    console.log("hex2");
                    console.log(hexagon2Coordinates);
                    console.log("side: " + (sideNumber + 3) % 6);
                    combinedSides.push(new _combinedSideJs2["default"](game, hexInfo));
                } else {
                    continue;
                }
            }
        }
    }
    return combinedSides;
}

function createGrid(game, gridSizeX, gridSizeY, sideLength, spaceFactor) {
    var hexagons = [];
    for (var x = 0; x < gridSizeX; x++) {
        var current_row = [];
        hexagons.push(current_row);
        for (var y = 0; y < gridSizeY; y++) {
            var hexagon = new _hexagonJs2["default"](sideLength, { x: x, y: y }, spaceFactor, game);
            hexagon.drawHexagonSides(getSpaceHexPoints(sideLength * spaceFactor));
            //for "across hex" mode
            //hexagon.drawHexagonSides(getSpaceHexPoints(sideLength));
            current_row.push(hexagon);
        }
    }
    return hexagons;
}

window.onload = function () {

    var width = 1000;
    var height = 480;

    var game = new Phaser.Game(width, height, Phaser.CANVAS, "phaser_parent", { preload: onPreload, create: onCreate, update: update, render: render });

    var gridSizeX = 5;
    var gridSizeY = 3;
    var lineGraphics = [];
    var hexagons = [];
    var i = 0;
    var sideLength = undefined;
    if (width < height) {
        sideLength = width / ((gridSizeX + 1) * 1.5);
    } else {
        sideLength = height / ((gridSizeY + 1) * 2 * Math.sin(Math.PI / 3));
    }

    var spaceFactor = 0.6;
    var combinedSides = [];

    function onPreload() {}

    function onCreate() {
        game.stage.backgroundColor = "#000000"; //consider grey because less contrast
        hexagons = createGrid(game, gridSizeX, gridSizeY, sideLength, spaceFactor);
        combinedSides = createCombinedLines(game, hexagons);
    }

    function update() {
        i++;
        if (i % 10 === 0) {
            console.log("1 in 100 update");
            var hexagon = hexagons[Math.floor(Math.random() * gridSizeX)][Math.floor(Math.random() * gridSizeY)];
            //hexagon.rotate(1);
            //hexagon.drawHexagonSides(getSpaceHexPoints(sideLength));
            //todo: have combinedSides listen for rotation of their hexagons
            //then we can only update those effected by the rotation
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = hexagons[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var row = _step.value;
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = row[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var _hexagon = _step3.value;

                            if (_hexagon.dirty) {
                                _hexagon.drawHexagonSides(getSpaceHexPoints(sideLength * spaceFactor));
                                //for "across hex" mode
                                //hexagon.drawHexagonSides(getSpaceHexPoints(sideLength));
                                _hexagon.dirty = false;
                            }
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
                                _iterator3["return"]();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator["return"]) {
                        _iterator["return"]();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = combinedSides[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var combinedSide = _step2.value;

                    //comment out for "across hex"
                    combinedSide.draw(getSpaceHexPoints(sideLength));
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                        _iterator2["return"]();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }
    }

    function render() {}
};

},{"./combinedSide.js":1,"./hexagon.js":2}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvdmFncmFudC9zb3VyY2UvY29tYmluZWRTaWRlLmpzIiwiL3ZhZ3JhbnQvc291cmNlL2hleGFnb24uanMiLCIvdmFncmFudC9zb3VyY2UvbGF6eURlc2lnbi5qcyIsIi92YWdyYW50L3NvdXJjZS9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs0QkNBNkIsaUJBQWlCOztJQUV6QixZQUFZO0FBQ2xCLGFBRE0sWUFBWSxDQUNqQixJQUFJLEVBQUUsWUFBWSxFQUFDOzhCQURkLFlBQVk7O0FBRXpCLFlBQUcsWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUM7QUFDdEQsbUJBQU8sQ0FBQyxHQUFHLENBQUMseURBQXlELENBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2hHO0FBQ0QsWUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7QUFDakMsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEg7Ozs7aUJBUGdCLFlBQVk7O2VBVXpCLGNBQUMsU0FBUyxFQUFDO0FBQ1gsZ0JBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDdEIsZ0JBQUksT0FBTyxHQUFHLG9CQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzFGLGdCQUFHLElBQUks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QVEsOEhBQUM7d0JBQWhCLEdBQUc7Ozs7OztBQUNQLDhDQUFtQixHQUFHLG1JQUFDO2dDQUFmLFFBQU87O0FBQ1gsZ0NBQUcsUUFBTyxDQUFDLEtBQUssRUFBQztBQUNiLHdDQUFPLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsVUFBVSxHQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7OztBQUdwRSx3Q0FBTyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7NkJBQ3pCO3lCQUNKOzs7Ozs7Ozs7Ozs7Ozs7aUJBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNELHNDQUF3QixhQUFhLG1JQUFDO3dCQUE5QixZQUFZOzs7QUFFaEIsZ0NBQVksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztpQkFDcEQ7Ozs7Ozs7Ozs7Ozs7OztTQUNKO0tBQ0o7O0FBRUQsYUFBUyxNQUFNLEdBQUUsRUFBRTtDQUN0QixDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7Y29sb3VycywgdGVhbXN9IGZyb20gXCIuL2xhenlEZXNpZ24uanNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29tYmluZWRTaWRle1xuICAgIGNvbnN0cnVjdG9yKGdhbWUsIGhleGFnb25JbmZvcyl7XG4gICAgICAgIGlmKGhleGFnb25JbmZvcy5sZW5ndGggIT09IDEgJiYgaGV4YWdvbkluZm9zLmxlbmd0aCAhPT0gMil7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImNvbWJpbmVkIHNpZGUgZXhwZWN0cyB0byBjb21iaW5lIDEgb3IgMiBoZXhhZ29ucywgbm90OiBcIiAuIGhleGFnb25JbmZvcy5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGV4YWdvbkluZm9zID0gaGV4YWdvbkluZm9zO1xuICAgICAgICB0aGlzLmdyYXBoaWNzID0gZ2FtZS5hZGQuZ3JhcGhpY3MoaGV4YWdvbkluZm9zWzBdLmhleGFnb24ud29ybGRDb3Jkcy54LGhleGFnb25JbmZvc1swXS5oZXhhZ29uLndvcmxkQ29yZHMueSk7XG4gICAgfVxuXG4gICAgLy90aGlzIHBhcmFtZXRlciBpcyBwcmV0dHkgZ3Jvc3NcbiAgICBkcmF3KGhleFBvaW50cyl7XG4gICAgICAgIHRoaXMuZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICAgICAgbGV0IGNvbG91cjEgPSB0ZWFtc1t0aGlzLmhleGFnb25JbmZvc1swXS5oZXhhZ29uLnNpZGVzW3RoaXMuaGV4YWdvbkluZm9zWzBdLnNpZGVdXS5jb2xvdXI7XG4gICAgICAgIGlmKHRoaXMuaGV4YWdvbkluZm9zLmxlbmd0aCA9PT0gMSl7XG4gICAgICAgICAgIHRoaXMuZ3JhcGhpY3MubGluZVN0eWxlKDEwLCBjb2xvdXIxLCAxMDApO1xuICAgICAgIH1lbHNle1xuICAgICAgICAgICAgbGV0IGNvbG91cjIgPSB0ZWFtc1t0aGlzLmhleGFnb25JbmZvc1sxXS5oZXhhZ29uLnNpZGVzW3RoaXMuaGV4YWdvbkluZm9zWzFdLnNpZGVdXS5jb2xvdXI7XG4gICAgICAgICAgICB0aGlzLmdyYXBoaWNzLmxpbmVTdHlsZSgxMCwgdGhpcy5jb2xvdXJDb21iaW5hdGlvbnMoY29sb3VyMSwgY29sb3VyMikpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzdGFydCA9IGhleFBvaW50c1t0aGlzLmhleGFnb25JbmZvc1swXS5zaWRlXTtcbiAgICAgICAgdGhpcy5ncmFwaGljcy5tb3ZlVG8oc3RhcnQueCwgc3RhcnQueSk7XG4gICAgICAgIGxldCBlbmQgPSBoZXhQb2ludHNbKHRoaXMuaGV4YWdvbkluZm9zWzBdLnNpZGUrMSklNl07XG4gICAgICAgIC8va2VlcCB0aGlzIGFzIHBvc3NpYmxlIGFsdGVybmF0aXZlLCBjYXVzZSBpdCBsb29rZWQgY29vbFxuICAgICAgICAvL3Byb2JhYmx5IGJlIGJldHRlciBpZiB0aGlzIHdhcyBkb25lIG9uIHRoZSBoZXhhZ29uIHNpZGVzIGFuZCBjb21iaW5lIHNpZGVzIGlnbm9yZSBpbiB0aGF0IG1vZGVcbiAgICAgICAgLy9sZXQgZW5kID0gaGV4UG9pbnRzW3RoaXMuaGV4YWdvbkluZm9zWzFdLnNpZGVdO1xuICAgICAgICB0aGlzLmdyYXBoaWNzLmxpbmVUbyhlbmQueCwgZW5kLnkpO1xuICAgIH1cblxuICAgIGNvbG91ckNvbWJpbmF0aW9ucyhjb2xvdXIxLCBjb2xvdXIyKXtcbiAgICAgICAgbGV0IGNvbG91cnNUb0NvbWJpbmUgPSBbY29sb3VyMSwgY29sb3VyMl07XG4gICAgICAgIGlmKGNvbG91cjEgPT09IGNvbG91cjIpe1xuICAgICAgICAgICAgcmV0dXJuIGNvbG91cjE7XG4gICAgICAgIH1lbHNlIGlmKGNvbG91cnNUb0NvbWJpbmUuaW5jbHVkZXMoY29sb3Vycy5nZXQoXCJyZWRcIikpICYmIGNvbG91cnNUb0NvbWJpbmUuaW5jbHVkZXMoY29sb3Vycy5nZXQoXCJ5ZWxsb3dcIikpKXtcbiAgICAgICAgICAgIHJldHVybiBjb2xvdXJzLmdldChcIm9yYW5nZVwiKTtcbiAgICAgICAgfWVsc2UgaWYoY29sb3Vyc1RvQ29tYmluZS5pbmNsdWRlcyhjb2xvdXJzLmdldChcInJlZFwiKSkgJiYgY29sb3Vyc1RvQ29tYmluZS5pbmNsdWRlcyhjb2xvdXJzLmdldChcImJsdWVcIikpKXtcbiAgICAgICAgICAgIHJldHVybiBjb2xvdXJzLmdldChcInB1cnBsZVwiKTtcbiAgICAgICAgfWVsc2UgaWYoY29sb3Vyc1RvQ29tYmluZS5pbmNsdWRlcyhjb2xvdXJzLmdldChcInllbGxvd1wiKSkgJiYgY29sb3Vyc1RvQ29tYmluZS5pbmNsdWRlcyhjb2xvdXJzLmdldChcImJsdWVcIikpKXtcbiAgICAgICAgICAgIHJldHVybiBjb2xvdXJzLmdldChcImdyZWVuXCIpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IsIG5vdCBjb2xvdXIgY29tYmluYXRpb24gYXZhaWxpYmxlXCIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY29sb3VyMSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb2xvdXIyKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7dGVhbXN9IGZyb20gXCIuL2xhenlEZXNpZ24uanNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSGV4YWdvbntcbiAgICBjb25zdHJ1Y3RvcihzaWRlTGVuZ3RoLCBncmlkQ29yZHMsIHNwYWNlRmFjdG9yLCBnYW1lKSB7XG4gICAgICAgIHRoaXMuc2lkZUxlbmd0aCA9IHNpZGVMZW5ndGg7XG4gICAgICAgIHRoaXMuZ3JpZENvcmRzID0gZ3JpZENvcmRzO1xuICAgICAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICAgICAgICBsZXQge3BvbHlnb259ID0gdGhpcy5idWlsZEhleGFnb25Qb2x5Z29uKHRoaXMuc2lkZUxlbmd0aCpzcGFjZUZhY3Rvcik7XG4gICAgICAgIHRoaXMucG9seWdvbiA9IHBvbHlnb247XG4gICAgICAgIGxldCBoZXhhZ29uSGVpZ2h0ID0gMipNYXRoLnNpbihNYXRoLlBJLzMpKnNpZGVMZW5ndGg7XG4gICAgICAgIC8vcGx1cyBvbmVzIHNvIHdlIGRvbid0IGdldCBjdXQgb2ZmIGJ5IGVkZ2Ugb2YgbWFwXG4gICAgICAgIHRoaXMud29ybGRDb3JkcyA9IHtcbiAgICAgICAgICAgIHg6IHNpZGVMZW5ndGgqKGdyaWRDb3Jkcy54KzEpKjEuNSxcbiAgICAgICAgICAgIHk6IGhleGFnb25IZWlnaHQqKGdyaWRDb3Jkcy55KzEpXG4gICAgICAgIH07XG4gICAgICAgIGlmKHRoaXMuZ3JpZENvcmRzLnglMj09MSl7XG4gICAgICAgICAgICB0aGlzLndvcmxkQ29yZHMueSAtPSBoZXhhZ29uSGVpZ2h0LzI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zaWRlcyA9IHRoaXMuYXNzaWduU2lkZXModGVhbXMpO1xuICAgICAgICB0aGlzLmltYWdlID0gZ2FtZS5hZGQuaW1hZ2UodGhpcy53b3JsZENvcmRzLngsIHRoaXMud29ybGRDb3Jkcy55KTtcbiAgICAgICAgdGhpcy5pbWFnZS5pbnB1dEVuYWJsZWQgPSB0cnVlO1xuICAgICAgICBsZXQgaGV4YWdvbiA9IHRoaXM7XG4gICAgICAgIC8vdGhpcyBpc24ndCBwaXhsZSBwZXJmZWN0LCBzbyB1c2UgaW4gY29uanVjdGlvbiB3aXRoIHBvbHlnb24gaGl0IHRlc3Q/XG4gICAgICAgIC8vYXNzdW1pbmcgYm94IGZvciB0aGlzIHRlc3RpIGlzIHRvbyBiaWcsIG5vdCB0b28gc21hbGxcbiAgICAgICAgdGhpcy5pbWFnZS5ldmVudHMub25JbnB1dERvd24uYWRkKGZ1bmN0aW9uKHMpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NsaWNrZWQnKTtcbiAgICAgICAgICAgIGhleGFnb24ucm90YXRlKDEpO1xuICAgICAgICAgICAgaGV4YWdvbi5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICAvL2NoZWNrIEdyYXBoaWNzLmdlbmVyYXRlVGV4dHVyZSBmb3IgcGVyZm9ybWFuY2UgdGlwXG4gICAgICAgIHRoaXMuZ3JhcGhpY3MgPSBuZXcgUGhhc2VyLkdyYXBoaWNzKGdhbWUsIDAsIDApO1xuICAgICAgICB0aGlzLmltYWdlLmFkZENoaWxkKHRoaXMuZ3JhcGhpY3MpO1xuICAgICAgICB0aGlzLmJ1aWxkR3JhcGhpYygpO1xuICAgICAgICB0aGlzLnNpZGVHcmFwaGljcyA9IG5ldyBQaGFzZXIuR3JhcGhpY3MoZ2FtZSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW1hZ2UuYWRkQ2hpbGQodGhpcy5zaWRlR3JhcGhpY3MpO1xuICAgIH1cblxuICAgIGFzc2lnblNpZGVzKHRlYW1zKXtcbiAgICAgICAgbGV0IHNpZGVzID0gW107XG4gICAgICAgIGZvcihsZXQgc2lkZU51bWJlciA9IDA7IHNpZGVOdW1iZXIgPCA2OyBzaWRlTnVtYmVyKyspe1xuICAgICAgICAgICAgLy9mb3Igbm9uLXJhbmRvbSBzaWRlc1xuICAgICAgICAgICAgLy9zaWRlcy5wdXNoKHNpZGVOdW1iZXIldGVhbXMubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vZm9yIHJhbmRvbSBzaWRlc1xuICAgICAgICAgICAgc2lkZXMucHVzaChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqdGVhbXMubGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpZGVzO1xuICAgIH1cblxuICAgIHJvdGF0ZShhbW91bnQpe1xuICAgICAgICBhbW91bnQgPSBhbW91bnQgJSA2O1xuICAgICAgICAvL2ZvciBhbnRpLWNsb2Nrd2lzZVxuICAgICAgICBpZihhbW91bnQgPCAwKXtcbiAgICAgICAgICAgIGFtb3VudCA9IDYtYW1vdW50O1xuICAgICAgICB9XG4gICAgICAgIGZvcihsZXQgaT0wO2k8YW1vdW50O2krKyl7XG4gICAgICAgICAgICB0aGlzLnNpZGVzLnVuc2hpZnQodGhpcy5zaWRlcy5wb3AoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZEhleGFnb25Qb2x5Z29uKHNpZGVMZW5ndGgpe1xuICAgICAgICBsZXQgY29ybmVyX3ZlcnRpY2FsID0gTWF0aC5zaW4oTWF0aC5QSS8zKSpzaWRlTGVuZ3RoO1xuICAgICAgICBsZXQgY29ybmVyX2hvcml6b250YWwgPSBNYXRoLmNvcyhNYXRoLlBJLzMpKnNpZGVMZW5ndGg7XG4gICAgICAgIGxldCBwb2x5Z29uID0gbmV3IFBoYXNlci5Qb2x5Z29uKFxuICAgICAgICAgICAgbmV3IFBoYXNlci5Qb2ludCgtY29ybmVyX2hvcml6b250YWwsIC1jb3JuZXJfdmVydGljYWwpLFxuICAgICAgICAgICAgbmV3IFBoYXNlci5Qb2ludCgrY29ybmVyX2hvcml6b250YWwsIC1jb3JuZXJfdmVydGljYWwpLFxuICAgICAgICAgICAgbmV3IFBoYXNlci5Qb2ludChzaWRlTGVuZ3RoLCAwKSxcbiAgICAgICAgICAgIG5ldyBQaGFzZXIuUG9pbnQoK2Nvcm5lcl9ob3Jpem9udGFsLCArY29ybmVyX3ZlcnRpY2FsKSxcbiAgICAgICAgICAgIG5ldyBQaGFzZXIuUG9pbnQoLWNvcm5lcl9ob3Jpem9udGFsLCArY29ybmVyX3ZlcnRpY2FsKSxcbiAgICAgICAgICAgIG5ldyBQaGFzZXIuUG9pbnQoLXNpZGVMZW5ndGgsIDApXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB7cG9seWdvbjogcG9seWdvbiwgaGVpZ2h0OiAyKk1hdGguc2luKE1hdGguUEkvMykqc2lkZUxlbmd0aH07XG4gICAgfVxuXG4gICAgZHJhd0hleGFnb25TaWRlcyhoZXhQb2ludHMpe1xuICAgICAgICB0aGlzLnNpZGVHcmFwaGljcy5jbGVhcigpO1xuICAgICAgICBmb3IobGV0IHNpZGVOdW1iZXIgPSAwOyBzaWRlTnVtYmVyIDwgNjsgc2lkZU51bWJlcisrKXtcbiAgICAgICAgICAgIGxldCBjb2xvdXIgPSB0ZWFtc1t0aGlzLnNpZGVzW3NpZGVOdW1iZXJdXS5jb2xvdXI7XG4gICAgICAgICAgICB0aGlzLnNpZGVHcmFwaGljcy5saW5lU3R5bGUoNSwgY29sb3VyLCAxMDApO1xuICAgICAgICAgICAgbGV0IHN0YXJ0ID0gaGV4UG9pbnRzW3NpZGVOdW1iZXJdO1xuICAgICAgICAgICAgdGhpcy5zaWRlR3JhcGhpY3MubW92ZVRvKHN0YXJ0LngsIHN0YXJ0LnkpO1xuICAgICAgICAgICAgbGV0IGVuZCA9IGhleFBvaW50c1soc2lkZU51bWJlcisxKSU2XTtcbiAgICAgICAgICAgIC8vZm9yIFwiYWNyb3NzIGhleFwiIG1vZGVcbiAgICAgICAgICAgIC8vbGV0IGVuZCA9IGhleFBvaW50c1soc2lkZU51bWJlciszKSU2XTtcbiAgICAgICAgICAgIHRoaXMuc2lkZUdyYXBoaWNzLmxpbmVUbyhlbmQueCwgZW5kLnkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRHcmFwaGljKCl7XG4gICAgICAgIHRoaXMuZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5ncmFwaGljcy5iZWdpbkZpbGwoMHhGRjMzZmYpO1xuICAgICAgICB0aGlzLmdyYXBoaWNzLmRyYXdQb2x5Z29uKHRoaXMucG9seWdvbi5wb2ludHMpO1xuICAgICAgICB0aGlzLmdyYXBoaWNzLmVuZEZpbGwoKTtcbiAgICAgICAgLy9sb29rIGF0IGFkZGluZyB0aGlzIHRvIGEgZ3JvdXAvaW1hZ2UgY2xhc3Mgd2l0aCB0aGUgZ3JhcGhpY3Mgb2JqZWN0XG4gICAgICAgIHZhciBoZXhhZ29uVGV4dCA9IHRoaXMuZ2FtZS5hZGQudGV4dCh0aGlzLndvcmxkQ29yZHMueC0xMCwgdGhpcy53b3JsZENvcmRzLnktMTAsIHRoaXMuZ3JpZENvcmRzLnggKyBcIixcIiArIHRoaXMuZ3JpZENvcmRzLnkpO1xuICAgICAgICBoZXhhZ29uVGV4dC5mb250ID0gXCJhcmlhbFwiO1xuICAgICAgICBoZXhhZ29uVGV4dC5mb250U2l6ZSA9IDg7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNvbnN0IGNvbG91cnMgPSBuZXcgTWFwKFtcbiAgICBbXCJyZWRcIiwgMHhmZjAwMDBdLFxuICAgIFtcInllbGxvd1wiLCAweGViZmYwMF0sXG4gICAgW1wiYmx1ZVwiLCAweDAwMDBmZl0sXG4gICAgW1wib3JhbmdlXCIsIDB4ZmZiMDAwXSxcbiAgICBbXCJwdXJwbGVcIiwgMHhhZjAwZmZdLFxuICAgIFtcImdyZWVuXCIsIDB4MDBmZjAwXSxcbl0pO1xuXG5leHBvcnQgY29uc3QgdGVhbXMgPSBbXG4gICAge1xuICAgICAgICBudW1iZXI6IDAsXG4gICAgICAgIGNvbG91cjogY29sb3Vycy5nZXQoXCJyZWRcIilcbiAgICB9LFxuICAgIHtcbiAgICAgICAgbnVtYmVyOiAxLFxuICAgICAgICBjb2xvdXI6IGNvbG91cnMuZ2V0KFwieWVsbG93XCIpXG4gICAgfSxcbiAgICB7XG4gICAgICAgIG51bWJlcjogMixcbiAgICAgICAgY29sb3VyOiBjb2xvdXJzLmdldChcImJsdWVcIilcbiAgICB9XG5dO1xuIiwiLy9pZiB3ZSB3YW50IHRvIHBhY2sgcGhhc2VyIGluIHRoZSBidWlsZFxyXG4vL2ltcG9ydCBQaGFzZXIgZnJvbSBcIlBoYXNlclwiO1xyXG4vL2hhY2sgY2F1c2UgaHR0cHM6Ly9naXRodWIuY29tL3Bob3RvbnN0b3JtL3BoYXNlci9pc3N1ZXMvMjQyNFxyXG4vL3dpbmRvdy5QSVhJID0gcmVxdWlyZSggJ3BoYXNlci9idWlsZC9jdXN0b20vcGl4aScgKTtcclxuLy93aW5kb3cucDIgPSByZXF1aXJlKCAncGhhc2VyL2J1aWxkL2N1c3RvbS9wMicgKTtcclxuLy93aW5kb3cuUGhhc2VyID0gcmVxdWlyZSggJ3BoYXNlci9idWlsZC9jdXN0b20vcGhhc2VyLXNwbGl0JyApO1xyXG5cclxuaW1wb3J0IEhleGFnb24gZnJvbSBcIi4vaGV4YWdvbi5qc1wiO1xyXG5pbXBvcnQgQ29tYmluZWRTaWRlIGZyb20gXCIuL2NvbWJpbmVkU2lkZS5qc1wiO1xyXG5cclxuZnVuY3Rpb24gZ2V0U3BhY2VIZXhQb2ludHMoc2lkZUxlbmd0aCl7XHJcbiAgICBsZXQgY29ybmVyX3ZlcnRpY2FsID0gTWF0aC5zaW4oTWF0aC5QSS8zKSpzaWRlTGVuZ3RoO1xyXG4gICAgbGV0IGNvcm5lcl9ob3Jpem9udGFsID0gTWF0aC5jb3MoTWF0aC5QSS8zKSpzaWRlTGVuZ3RoO1xyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICB7eDogLWNvcm5lcl9ob3Jpem9udGFsLCB5OiAtY29ybmVyX3ZlcnRpY2FsfSxcclxuICAgICAgICB7eDogK2Nvcm5lcl9ob3Jpem9udGFsLCB5OiAtY29ybmVyX3ZlcnRpY2FsfSxcclxuICAgICAgICB7eDogc2lkZUxlbmd0aCwgeTogMH0sXHJcbiAgICAgICAge3g6ICtjb3JuZXJfaG9yaXpvbnRhbCwgeTogK2Nvcm5lcl92ZXJ0aWNhbH0sXHJcbiAgICAgICAge3g6IC1jb3JuZXJfaG9yaXpvbnRhbCwgeTogK2Nvcm5lcl92ZXJ0aWNhbH0sXHJcbiAgICAgICAge3g6IC1zaWRlTGVuZ3RoLCB5OiAwfVxyXG4gICAgXTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0QWRqYWNlbnRIZXhhZ29uT2Zmc2V0KGdyaWRYLCBzaWRlKXtcclxuICAgIC8vZXZlbiBjb2x1bW46IG9kZCBjb2x1bW46XHJcbiAgICAvLyphKiAgICAgICAgICBhYWFcclxuICAgIC8vYWhhICAgICAgICAgIGFoYVxyXG4gICAgLy9hYWEgICAgICAgICAgKmEqXHJcbiAgICBsZXQgZGlhZ29uYWxZQWJvdmUgPSBncmlkWCUyO1xyXG4gICAgbGV0IGRpYWdvbmFsWUJlbG93ID0gZ3JpZFglMi0xO1xyXG4gICAgLy9hc3N1bWVzIHNpZGUgMCBpcyB0b3AsIGluY3JlYXNpbmcgY2xvY2t3aXNlXHJcbiAgICBsZXQgYWRqYWNlbnRIZXhPZmZzZXQgPSBbXHJcbiAgICAgICAge3g6IDAsIHk6IC0xfSwge3g6IDEsIHk6IC1ncmlkWCUyfSwge3g6IDEsIHk6IDEtZ3JpZFglMn0sXHJcbiAgICAgICAge3g6IDAsIHk6IDF9LCB7eDogLTEsIHk6IDEtZ3JpZFglMn0sIHt4OiAtMSwgeTogLWdyaWRYJTJ9XHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIGFkamFjZW50SGV4T2Zmc2V0W3NpZGVdO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVDb21iaW5lZExpbmVzKGdhbWUsIGhleGFnb25zKXtcclxuICAgIGxldCBjb21iaW5lZFNpZGVzID0gW107XHJcbiAgICBmb3IobGV0IHggPSAwOyB4IDwgaGV4YWdvbnMubGVuZ3RoOyB4Kyspe1xyXG4gICAgICAgIGZvcihsZXQgeSA9IDA7IHkgPCBoZXhhZ29uc1t4XS5sZW5ndGg7IHkrKyl7XHJcbiAgICAgICAgICAgIGxldCBjZW50ZXJIZXhhZ29uID0gaGV4YWdvbnNbeF1beV07XHJcbiAgICAgICAgICAgIGZvcihsZXQgc2lkZU51bWJlciA9IDA7IHNpZGVOdW1iZXIgPCA2OyBzaWRlTnVtYmVyKyspe1xyXG4gICAgICAgICAgICAgICAgbGV0IGhleEluZm8gPSBbe1xyXG4gICAgICAgICAgICAgICAgICAgIGhleGFnb246IGNlbnRlckhleGFnb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc2lkZTogc2lkZU51bWJlclxyXG4gICAgICAgICAgICAgICAgfV07XHJcbiAgICAgICAgICAgICAgICBsZXQgYWRqYWNlbnRIZXhPZmZzZXQgPSBnZXRBZGphY2VudEhleGFnb25PZmZzZXQoeCwgc2lkZU51bWJlcik7XHJcbiAgICAgICAgICAgICAgICBsZXQgaGV4YWdvbjJDb29yZGluYXRlcyA9IHt4OiB4ICsgYWRqYWNlbnRIZXhPZmZzZXQueCwgeTogeSArIGFkamFjZW50SGV4T2Zmc2V0Lnl9O1xyXG4gICAgICAgICAgICAgICAgbGV0IGhleGFnb24yRXhpc3RzID0gIShoZXhhZ29uMkNvb3JkaW5hdGVzLnggPCAwIHx8IGhleGFnb24yQ29vcmRpbmF0ZXMueCA+PSBoZXhhZ29ucy5sZW5ndGggfHwgaGV4YWdvbjJDb29yZGluYXRlcy55IDwgMCB8fCBoZXhhZ29uMkNvb3JkaW5hdGVzLnkgPj0gaGV4YWdvbnNbeF0ubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGlmKCFoZXhhZ29uMkV4aXN0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tYmluZWRTaWRlcy5wdXNoKG5ldyBDb21iaW5lZFNpZGUoZ2FtZSwgaGV4SW5mbykpO1xyXG4gICAgICAgICAgICAgICAgfWVsc2UgaWYoc2lkZU51bWJlciA8IDMpe1xyXG4gICAgICAgICAgICAgICAgICAgLy9zaWRlcyBudW1iZXJlZCBhYm92ZSAzIGFyZSBjb3ZlcmVkIHdobiB3ZSBpdGVyYXRlIG92ZXIgdGhlIG90aGVyIGhleGFnb24gKHNvIHdlIGRvbid0IGNyZWF0ZSBldmVyeSBjb21iaW5lIHR3aWNlKVxyXG4gICAgICAgICAgICAgICAgICAgaGV4SW5mby5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICBoZXhhZ29uOiBoZXhhZ29uc1toZXhhZ29uMkNvb3JkaW5hdGVzLnhdW2hleGFnb24yQ29vcmRpbmF0ZXMueV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgc2lkZTogKHNpZGVOdW1iZXIgKyAzKSAlIDZcclxuICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjZW50ZXIgaGV4XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY2VudGVySGV4YWdvbi5ncmlkQ29yZHMpO1xyXG4gICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJzaWRlOiBcIiArIHNpZGVOdW1iZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJoZXgyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coaGV4YWdvbjJDb29yZGluYXRlcyk7XHJcbiAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInNpZGU6IFwiICsgKChzaWRlTnVtYmVyICsgMykgJSA2KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tYmluZWRTaWRlcy5wdXNoKG5ldyBDb21iaW5lZFNpZGUoZ2FtZSwgaGV4SW5mbykpO1xyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY29tYmluZWRTaWRlcztcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlR3JpZChnYW1lLCBncmlkU2l6ZVgsIGdyaWRTaXplWSwgc2lkZUxlbmd0aCwgc3BhY2VGYWN0b3Ipe1xyXG4gICAgbGV0IGhleGFnb25zID0gW107XHJcbiAgICBmb3IobGV0IHggPSAwOyB4IDwgZ3JpZFNpemVYOyB4Kyspe1xyXG4gICAgICAgIGxldCBjdXJyZW50X3JvdyA9IFtdO1xyXG4gICAgICAgIGhleGFnb25zLnB1c2goY3VycmVudF9yb3cpO1xyXG4gICAgICAgIGZvcihsZXQgeSA9IDA7IHkgPCBncmlkU2l6ZVk7IHkrKyl7XHJcbiAgICAgICAgICAgIGxldCBoZXhhZ29uID0gbmV3IEhleGFnb24oc2lkZUxlbmd0aCwge3g6IHgsIHk6IHl9LCBzcGFjZUZhY3RvciwgZ2FtZSk7XHJcbiAgICAgICAgICAgIGhleGFnb24uZHJhd0hleGFnb25TaWRlcyhnZXRTcGFjZUhleFBvaW50cyhzaWRlTGVuZ3RoKnNwYWNlRmFjdG9yKSk7XHJcbiAgICAgICAgICAgIC8vZm9yIFwiYWNyb3NzIGhleFwiIG1vZGVcclxuICAgICAgICAgICAgLy9oZXhhZ29uLmRyYXdIZXhhZ29uU2lkZXMoZ2V0U3BhY2VIZXhQb2ludHMoc2lkZUxlbmd0aCkpO1xyXG4gICAgICAgICAgICBjdXJyZW50X3Jvdy5wdXNoKGhleGFnb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBoZXhhZ29ucztcclxufVxyXG5cclxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGxldCB3aWR0aCA9IDEwMDA7XHJcbiAgICBsZXQgaGVpZ2h0ID0gNDgwO1xyXG5cclxuXHRsZXQgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSh3aWR0aCwgaGVpZ2h0LCBQaGFzZXIuQ0FOVkFTLCBcInBoYXNlcl9wYXJlbnRcIiwge3ByZWxvYWQ6IG9uUHJlbG9hZCwgY3JlYXRlOiBvbkNyZWF0ZSwgdXBkYXRlOiB1cGRhdGUsIHJlbmRlcjogcmVuZGVyfSk7XHJcblxyXG5cdGxldCBncmlkU2l6ZVggPSA1O1xyXG5cdGxldCBncmlkU2l6ZVkgPSAzO1xyXG4gICAgbGV0IGxpbmVHcmFwaGljcyA9IFtdO1xyXG4gICAgbGV0IGhleGFnb25zID0gW107XHJcbiAgICBsZXQgaT0wO1xyXG4gICAgbGV0IHNpZGVMZW5ndGg7XHJcbiAgICBpZih3aWR0aCA8IGhlaWdodCl7XHJcbiAgICAgICAgc2lkZUxlbmd0aCA9IHdpZHRoLygoZ3JpZFNpemVYKzEpKjEuNSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaWRlTGVuZ3RoID0gaGVpZ2h0LygoZ3JpZFNpemVZKzEpKjIqTWF0aC5zaW4oTWF0aC5QSS8zKSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHNwYWNlRmFjdG9yID0gMC42O1xyXG4gICAgbGV0IGNvbWJpbmVkU2lkZXMgPSBbXTtcclxuXHJcblx0ZnVuY3Rpb24gb25QcmVsb2FkKCkge31cclxuXHJcblx0ZnVuY3Rpb24gb25DcmVhdGUoKSB7XHJcblx0ICAgIGdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gXCIjMDAwMDAwXCI7Ly9jb25zaWRlciBncmV5IGJlY2F1c2UgbGVzcyBjb250cmFzdFxyXG4gICAgICAgIGhleGFnb25zID0gY3JlYXRlR3JpZChnYW1lLCBncmlkU2l6ZVgsIGdyaWRTaXplWSwgc2lkZUxlbmd0aCwgc3BhY2VGYWN0b3IpO1xyXG4gICAgICAgIGNvbWJpbmVkU2lkZXMgPSBjcmVhdGVDb21iaW5lZExpbmVzKGdhbWUsIGhleGFnb25zKTtcclxuXHR9XHJcblxyXG4gICAgZnVuY3Rpb24gdXBkYXRlKCl7XHJcbiAgICAgICAgaSsrO1xyXG4gICAgICAgIGlmKGklMTA9PT0wKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCIxIGluIDEwMCB1cGRhdGVcIik7XHJcbiAgICAgICAgICAgIGxldCBoZXhhZ29uID0gaGV4YWdvbnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmdyaWRTaXplWCldW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpncmlkU2l6ZVkpXTtcclxuICAgICAgICAgICAgLy9oZXhhZ29uLnJvdGF0ZSgxKTtcclxuICAgICAgICAgICAgLy9oZXhhZ29uLmRyYXdIZXhhZ29uU2lkZXMoZ2V0U3BhY2VIZXhQb2ludHMoc2lkZUxlbmd0aCkpO1xyXG4gICAgICAgICAgICAvL3RvZG86IGhhdmUgY29tYmluZWRTaWRlcyBsaXN0ZW4gZm9yIHJvdGF0aW9uIG9mIHRoZWlyIGhleGFnb25zXHJcbiAgICAgICAgICAgIC8vdGhlbiB3ZSBjYW4gb25seSB1cGRhdGUgdGhvc2UgZWZmZWN0ZWQgYnkgdGhlIHJvdGF0aW9uXHJcbiAgICAgICAgICAgIGZvcihsZXQgcm93IG9mIGhleGFnb25zKXtcclxuICAgICAgICAgICAgICAgIGZvcihsZXQgaGV4YWdvbiBvZiByb3cpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGhleGFnb24uZGlydHkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZXhhZ29uLmRyYXdIZXhhZ29uU2lkZXMoZ2V0U3BhY2VIZXhQb2ludHMoc2lkZUxlbmd0aCpzcGFjZUZhY3RvcikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2ZvciBcImFjcm9zcyBoZXhcIiBtb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaGV4YWdvbi5kcmF3SGV4YWdvblNpZGVzKGdldFNwYWNlSGV4UG9pbnRzKHNpZGVMZW5ndGgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGV4YWdvbi5kaXJ0eSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IobGV0IGNvbWJpbmVkU2lkZSBvZiBjb21iaW5lZFNpZGVzKXtcclxuICAgICAgICAgICAgICAgIC8vY29tbWVudCBvdXQgZm9yIFwiYWNyb3NzIGhleFwiXHJcbiAgICAgICAgICAgICAgICBjb21iaW5lZFNpZGUuZHJhdyhnZXRTcGFjZUhleFBvaW50cyhzaWRlTGVuZ3RoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVuZGVyKCl7fVxyXG59O1xyXG4iXX0=
