export class CombinedSide{
    constructor(hexagonInfos, cords){
        if(hexagonInfos.length !== 1 && hexagonInfos.length !== 2){
            console.log("combined side expects to combine 1 or 2 hexagons, not: " . hexagonInfos.length);
        }
        this.hexagonInfos = hexagonInfos;
        this.cords = cords;
    }

    get hexSideTeams(){
        let teamInfo = [];
        for(let hexagonInfo of this.hexagonInfos){
            teamInfo.push(hexagonInfo.hexagon.sides[hexagonInfo.side]);
        }
        return teamInfo;
    }

}
