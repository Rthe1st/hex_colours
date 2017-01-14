import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";

export default class{
    constructor(game, gridWidth, gridHeight, sideLength){
        this.hexagons = createGrid(game, gridWidth, gridHeight, sideLength);
        this.combinedSides = createCombinedLines(game, this.hexagons, sideLength);
    }

    destroy(){
        for(let row of this.hexagons){
            for(let hexagon of row){
                hexagon.destroy();
            }
        }
        for(let combinedSide of this.combinedSides){
            combinedSide.destroy();
        }
    }

    update(){
        for(let row of this.hexagons){
            for(let hexagon of row){
                hexagon.drawSides();
                hexagon.drawHexagon();
            }
        }
        for(let combinedSide of this.combinedSides){
            combinedSide.draw();
        }
    }

    updateSideLength(sideLength){
        for(let row of this.hexagons){
            for(let hexagon of row){
                hexagon.outerSideLength = sideLength;
                hexagon.refreshPosition();
            }
        }
        for(let combinedSide of this.combinedSides){
            combinedSide.length = sideLength;
            combinedSide.refreshPosition();
        }
    }

}

function getAdjacentHexagonOffset(gridX, side){
    //even column: odd column: (a means adjacent, * means not)
    //*a*          aaa
    //aha          aha
    //aaa          *a*
    let diagonalYAbove = 1-gridX%2;
    let diagonalYBelow = -gridX%2;
    //assumes side 0 is top, increasing clockwise
    let adjacentHexOffset = [
        {x: 0, y: -1}, {x: 1, y: diagonalYBelow}, {x: 1, y: diagonalYAbove},
        {x: 0, y: 1}, {x: -1, y: diagonalYAbove}, {x: -1, y: diagonalYBelow}
    ];
    return adjacentHexOffset[side];
}

function createCombinedLines(game, hexagons, sideLength){
    let combinedSides = [];
    for(let x = 0; x < hexagons.length; x++){
        for(let y = 0; y < hexagons[x].length; y++){
            let centerHexagon = hexagons[x][y];
            for(let sideNumber = 0; sideNumber < 6; sideNumber++){
                let hexInfo = [{
                    hexagon: centerHexagon,
                    side: sideNumber
                }];
                let adjacentHexOffset = getAdjacentHexagonOffset(x, sideNumber);
                let hexagon2Coordinates = {x: x + adjacentHexOffset.x, y: y + adjacentHexOffset.y};
                let hexagon2Exists = !(hexagon2Coordinates.x < 0 || hexagon2Coordinates.x >= hexagons.length || hexagon2Coordinates.y < 0 || hexagon2Coordinates.y >= hexagons[x].length);
                if(!hexagon2Exists){
                    combinedSides.push(new CombinedSide(game, hexInfo, sideLength));
                }else if(sideNumber < 3){
                   hexInfo.push({
                       hexagon: hexagons[hexagon2Coordinates.x][hexagon2Coordinates.y],
                       side: (sideNumber + 3) % 6
                   });
                    combinedSides.push(new CombinedSide(game, hexInfo, sideLength));
                }else{
                    //sides numbered above 3 are covered when we iterate over the other hexagon (so we don't create every combine twice)
                    continue;
                }
            }
        }
    }
    return combinedSides;
}

function createGrid(game, gridSizeX, gridSizeY, sideLength){
    let hexagons = [];
    for(let x = 0; x < gridSizeX; x++){
        let current_row = [];
        hexagons.push(current_row);
        for(let y = 0; y < gridSizeY; y++){
            let hexagon = new Hexagon(sideLength, {x: x, y: y}, game);
            hexagon.drawSides();
            current_row.push(hexagon);
        }
    }
    return hexagons;
}
