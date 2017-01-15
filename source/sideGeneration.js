export let mappingForDatGui = new Map([
    ["random", random],
    ["even", even]
]);

function buildBoard(sideGenerator, gridWidth, gridHeight){
    let rows = [];
    for(let row=0; row<gridWidth; row++){
        let hexagons = [];
        for(let height=0; height<gridHeight; height++){
            let sides = [];
            for(let side of sideGenerator()){
                sides.push(side);
            }
            hexagons.push(sides.join(":"));
        }
        rows.push(hexagons.join("h"));
    }
    return rows.join("r");
}

export function random(teams, gridWidth, gridHeight){
    function sideGenerator(){
        let sides = [];
        for(let sideNumber = 0; sideNumber < 6; sideNumber++){
            sides.push(Math.floor(Math.random()*teams.length));
        }
        return sides;
    }
    return buildBoard(sideGenerator, gridWidth, gridHeight);
}

export function even(teams, gridWidth, gridHeight){
    function sideGenerator(){
        let sides = [];
        for(let sideNumber = 0; sideNumber < 6; sideNumber++){
            sides.push(sideNumber%teams.length);
        }
        return sides;
    }
    return buildBoard(sideGenerator, gridWidth, gridHeight);
}
