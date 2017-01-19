import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";
import * as teamInfo from "./teamInfo.js";

let boardSettings = {
    spaceFactor: 0.6
};

export function boardSettingsGui(gui, game){
    gui.add(boardSettings, 'spaceFactor', 0, 2).listen().onFinishChange(function(genMethod){
        game.recreateBoard = true;
    });
}


export class Board{
    constructor(game, dataString, sideLength){
        this.hexagons = parseDataString(dataString, sideLength, game);
        this.combinedSides = createCombinedLines(game, this.hexagons, sideLength);
    }

    get dataString(){
        let rows = [];
        for(let row of this.hexagons){
            let hexagons = [];
            for(let hexagon of row){
                hexagons.push(hexagon.sidesAsString());
            }
            rows.push(hexagons.join("h"));
        }
        return rows.join("r");
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
                let newLocation = calculateWorldCords(hexagon.data.gridCords, sideLength);
                hexagon.refreshPositon(newLocation.x, newLocation.y, boardSettings.spaceFactor*sideLength);
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

function parseDataString(string, sideLength, game){
    let hexagons = [];
    for(let [x, rowData] of string.split("r").entries()){
        let row = parseRowString(rowData, sideLength, x, game);
        hexagons.push(row);
    }
    return hexagons;
}

function parseRowString(rowString, sideLength, x, game){
    let current_row = [];
    for(let [y, hexagonData] of rowString.split("h").entries()){
        let hexagon = parseHexString(hexagonData, sideLength, {x: x, y: y}, game);
        current_row.push(hexagon);
    }
    return current_row;
}

function parseHexString(hexagonString, sideLength, cords, game){
    let sides = [];
    for(let side of hexagonString.split(":")){
        sides.push(teamInfo.teams[side]);
    }
    if(sides.length !== 6){
        console.log("invalid map string hexagon");
        console.log(hexagonString);
    }
    let worldCords = calculateWorldCords(cords, sideLength);
    let hexagon = new Hexagon(game, worldCords.x, worldCords.y, boardSettings.spaceFactor*sideLength, cords, sides, function(clickedHexagon){
        clickedHexagon.rotate(1);
    });
    game.add.existing(hexagon);
    return hexagon;

}

function calculateWorldCords(gridCords, spacingSideLength){
    let ySpacing = 2*Math.sin(Math.PI/3)*spacingSideLength;
    let xSpacing = spacingSideLength*1.5;
    //plus ones so we don't get cut off by edge of map
    let position =  {
        x: (xSpacing*gridCords.x)+spacingSideLength,
        y: (ySpacing*gridCords.y)+(2*Math.sin(Math.PI/3)*spacingSideLength)
    };
    let isOddColumn = gridCords.x%2==1;
    if(isOddColumn){
        position.y -= ySpacing/2;
    }
    return position;
}
