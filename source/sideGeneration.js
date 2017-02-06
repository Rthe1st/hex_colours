export let mappingForDatGui = new Map([
    ["random", random],
    ["even", even],
    ["evenRandom", evenRandom]
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

export function evenRandomWithHomes(teams, gridWidth, gridHeight){
    function sideGenerator(){
        let sideSelection = [0,0,1,1,2,2];
        let sides = [];
        for(let sideNumber = 0; sideNumber < 6; sideNumber++){
            sides.push(sideSelection[Math.floor(Math.random())%6]);
        }
        return sides;
    }
    return buildBoard(sideGenerator, gridWidth, gridHeight);
}

export function evenRandom(teams, gridWidth, gridHeight){
    function sideGenerator(){
        let sideSelection = [0,0,1,1,2,2];
        let sides = [];
        for(let sideNumber = 0; sideNumber < 6; sideNumber++){
            let nextSide = sideSelection.splice(Math.floor(Math.random()*sideSelection.length)%sideSelection.length, 1);
            sides.push(nextSide[0]);
        }
        return sides;
    }
    return buildBoard(sideGenerator, gridWidth, gridHeight);
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
