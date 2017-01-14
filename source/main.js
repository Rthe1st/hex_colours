//if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

import dat from "dat-gui";
import {hexagonSettingsGui} from "./hexagon.js";
import {combinedSideSettingsGui} from "./combinedSide.js";
import Board from "./board.js";

function calculateSideLength(width, height, gridWidth, gridHeight){
    if(width < height){
        return width/((gridWidth+1)*1.5);
    }else{
        return height/((gridHeight+1)*2*Math.sin(Math.PI/3));
    }
}

let globalParams = {
    width: window.innerWidth,
    height: window.innerHeight,
    gridWidth: 5,
    gridHeight: 3
};

globalParams.sideLength = calculateSideLength(globalParams.width, globalParams.height, globalParams.gridWidth, globalParams.gridHeight);

function onCreate(game) {
    let settingsGui = new dat.GUI();
    game.stage.backgroundColor = "#000000";//consider grey because less contrast
    game.board = new Board(game, globalParams.gridWidth, globalParams.gridHeight, globalParams.sideLength, game.settingsGui);
    settingsGui.addColor(game.stage, 'backgroundColor');
    settingsGui.add(globalParams, 'width', 0, window.innerWidth).onFinishChange(function(newWidth){
        game.scale.setGameSize(newWidth, game.height);
    });
    settingsGui.add(globalParams, 'height', 0, window.innerHeight).onFinishChange(function(newHeight){
        game.scale.setGameSize(game.width, newHeight);
    });
    settingsGui.add(globalParams, 'sideLength', 0, 100).onFinishChange(function(sideLength){
        game.board.updateSideLength(sideLength);
    });
    settingsGui.add(globalParams, 'gridWidth', 0).onFinishChange(function(newWidth){
        game.recreateBoard = true;
    });
    settingsGui.add(globalParams, 'gridHeight', 0).onFinishChange(function(newHeight){
        game.recreateBoard = true;
    });
    hexagonSettingsGui(settingsGui);
    combinedSideSettingsGui(settingsGui);
}

function update(game){
    //so it's not destory mid update
    //this is why our classes should extend phases, so we don't have to deal with this stuff
    if(game.recreateBoard){
        game.board.destroy();
        game.board = new Board(game, globalParams.gridWidth, globalParams.gridHeight, globalParams.sideLength);
        game.recreateBoard = false;
    }
    game.board.update();
}

window.onload = function() {
	let game = new Phaser.Game(globalParams.gridWidth, globalParams.gridHeight, Phaser.CANVAS, "phaser_parent", {create: onCreate, update: update});
};
