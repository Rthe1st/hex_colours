export let mappingForDatGui = new Map([
    ["random", random],
    ["even", even],
    ["evenRandom", evenRandom]
]);

function generateCharacters(gridWidth, gridHeight){
    let characters = [];
    //we need at least 2 for it to be playable
    for(let i=0; i<2;i++){
        let x = Math.floor(Math.random()*gridWidth);
        let y = Math.floor(Math.random()*gridHeight);
        let side = Math.floor(Math.random()*6);
        characters.push([x, y, side, 0].join(","));
    }
    for(let character_number=0; character_number < 15; character_number++){
        if(Math.random() > 0.5){
            continue;
        }
        let x = Math.floor(Math.random()*gridWidth);
        let y = Math.floor(Math.random()*gridHeight);
        let side = Math.floor(Math.random()*6);
        characters.push([x, y, side, 0].join(","));
    }
    return characters.join(":");
}

function buildBoard(sideGenerator, gridWidth, gridHeight){
    let hexagons = [];
    for(let x=0; x<gridWidth; x++){
        for(let y=0; y<gridHeight; y++){
            let sides = [];
            for(let side of sideGenerator()){
                sides.push(side);
            }
            hexagons.push("(" + x + "," + y + ")" + sides.join(":"));
        }
    }
    return hexagons.join("|") + "-" + generateCharacters(gridWidth, gridHeight);
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
        let sides = [0];
        for(let sideNumber = 0; sideNumber < 5; sideNumber++){
            if(Math.random() > 0.5){
                sides.push(Math.floor(Math.random()*teams.length));
            }else{
                sides.unshift(Math.floor(Math.random()*teams.length));
            }

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
