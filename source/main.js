//if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

import dat from "dat-gui";
import {hexagonSettingsGui} from "./hexagon.js";
import {combinedSideSettingsGui} from "./combinedSide.js";
import {boardSettingsGui, Board} from "./board.js";
import {teamInfoSettingsGui, teams} from "./teamInfo.js";
import * as sideGeneration from "./sideGeneration.js";

//this doesnt work properly
function calculateSideLength(width, height, gridWidth, gridHeight){
    let boardWidth = (1.5*gridWidth)+1;
    let boardHeight = (2*Math.sin(Math.PI/3)*gridHeight)+(1.5*Math.sin(Math.PI/3));
    if(boardWidth > boardHeight){
        return width/(1.5*gridWidth+1);
    }else{
        return height/((2*Math.sin(Math.PI/3)*gridHeight)+(1.5*Math.sin(Math.PI/3)));
    }
}

let globalParams = {
    width: window.innerWidth,
    height: window.innerHeight,
    gridWidth: 2,
    gridHeight: 2,
    sideGeneration: "random",//be nice to store function directly here but doesn't play nice with dat-gui,
};

globalParams.sideLength = calculateSideLength(globalParams.width, globalParams.height, globalParams.gridWidth, globalParams.gridHeight);

function onCreate(game) {
    let settingsGui = new dat.GUI();
    game.stage.backgroundColor = "#000000";//consider grey because less contrast
    game.board = buildBoard(game);
    settingsGui.addColor(game.stage, 'backgroundColor');
    settingsGui.add(globalParams, 'width', 0, window.innerWidth).onFinishChange(function(newWidth){
        game.scale.setGameSize(newWidth, game.height);
        globalParams.sideLength = calculateSideLength(globalParams.width, globalParams.height, globalParams.gridWidth, globalParams.gridHeight);
        game.board.updateSideLength(globalParams.sideLength);
    });
    settingsGui.add(globalParams, 'height', 0, window.innerHeight).onFinishChange(function(newHeight){
        game.scale.setGameSize(game.width, newHeight);
        globalParams.sideLength = calculateSideLength(globalParams.width, globalParams.height, globalParams.gridWidth, globalParams.gridHeight);
        game.board.updateSideLength(globalParams.sideLength);
    });
    settingsGui.add(globalParams, 'sideLength', 0, 300).onFinishChange(function(sideLength){
        game.board.updateSideLength(sideLength);
    });
    settingsGui.add(globalParams, 'gridWidth', 0).step(1);
    settingsGui.add(globalParams, 'gridHeight', 0).step(1);
    settingsGui.add(globalParams, 'sideGeneration', ["random", "even", "dataString"]).listen().onFinishChange(function(genMethod){
        game.recreateBoard = true;
    });
    //this cant point to board.dataString because dat-gui doesn't work with getters/setters
    settingsGui.add(globalParams, 'dataString').onFinishChange(function(newDataString){
        game.recreateBoard = true;
    });
    boardSettingsGui(settingsGui);
    hexagonSettingsGui(settingsGui);
    combinedSideSettingsGui(settingsGui);
    teamInfoSettingsGui(settingsGui);
}

function buildBoard(game, boardData){
    if(globalParams.sideGeneration !== "dataString"){
        let generationFunction = sideGeneration.mappingForDatGui.get(globalParams.sideGeneration);
        boardData = generationFunction(teams, globalParams.gridWidth, globalParams.gridHeight);
        globalParams.sideLength = calculateSideLength(globalParams.width, globalParams.height, globalParams.gridWidth, globalParams.gridHeight);
    }
    let board = new Board(game, boardData, globalParams.sideLength);
    globalParams.dataString = board.dataString;
    globalParams.sideGeneration = "dataString";
    //todo: update dat-gui to relfect this^^
    return board;
}

function update(game){
    //so it's not destory mid update
    //this is why our classes should extend phases, so we don't have to deal with this stuff
    if(game.recreateBoard){
        game.board.destroy();
        game.board = buildBoard(game, globalParams.dataString);
        game.recreateBoard = false;
    }
    game.board.update();
}

window.onload = function() {
	let game = new Phaser.Game(globalParams.width, globalParams.height, Phaser.CANVAS, "phaser_parent", {create: onCreate, update: update});
};
