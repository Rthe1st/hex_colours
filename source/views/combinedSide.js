import * as geometry from "../geometry.js";

let lineStyle = {
    thickness: 0,
    alpha: 1
};

let combinedColours = {
    team_0_1: 0xff0000,//0xffb000,
    team_1_2: 0x666666,//0x00ff00,
    team_2_0: 0xff0000,//0xaf00ff
};

export function combinedSideSettingsGui(gui){
    let folder = gui.addFolder('combined side graphics');
    folder.add(lineStyle, 'thickness', 0,20);
    folder.add(lineStyle, 'alpha', 0, 1);
    folder.addColor(combinedColours, 'team_0_1');
    folder.addColor(combinedColours, 'team_1_2');
    folder.addColor(combinedColours, 'team_2_0');
}

export class CombinedSide extends Phaser.Sprite{
    /*
    model API:
        property hexSideTeams -> array of teamNumbers of adjacent hex sides
        proerty cords -> {x,y, side} standard corodinate for addressing combined sides
    */
    constructor(game, x, y, boardView, model){
        super(game, x, y);
        this.data.boardView = boardView;
        this.data.model = model;
        let hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.outerSideLength);
        let start = hexPoints[this.data.model.cords.side];
        let end = hexPoints[(this.data.model.cords.side + 1) % 6];
        this.data.graphics = new Phaser.Graphics(game, start.x, start.y);
        this.addChild(this.data.graphics);
        let textPosition = {x: (start.x + end.x)/2, y: (start.y + end.y)/2};
        this.data.text = new Phaser.Text(game, textPosition.x, textPosition.y, "");
        this.addChild(this.data.text);
        this.data.text.visible = false;
    }

    refreshPosition(){
        let worldCords = this.data.boardView.calculateWorldCords(this.data.model.cords);
        this.x = worldCords.x;
        this.y = worldCords.y;
        let hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.outerSideLength);
        let start = hexPoints[this.data.model.cords.side];
        let end = hexPoints[(this.data.model.cords.side + 1) % 6];
        this.data.graphics.x = start.x;
        this.data.graphics.y = start.y;
        this.data.text.x = (start.x + end.x)/2;
        this.data.text.y = (start.y + end.y)/2;
    }

    update(){
        this.refreshPosition();
        let externalTangentAngle = 60;
        this.data.graphics.angle = externalTangentAngle*this.data.model.cords.side;
        this.data.graphics.clear();
        let hexSideTeams = this.data.model.hexSideTeams;
        if(hexSideTeams.length === 0){
            return;
        }
        let firstTeam = hexSideTeams[0];
        let colour;
        if(hexSideTeams.length === 2){
            let secondTeam = hexSideTeams[1];
            colour = this.manualCombine(firstTeam, secondTeam);
        }else{
            colour = firstTeam.colour;
        }
        if(this.data.model.selected && false){
            //this is gonna be a real resource drain
            //should instead render to texture (6 different ones), then reapply
            let steps = 10;
            let maxThickness = lineStyle.thickness * 5;
            let thicknessStep = (maxThickness - lineStyle.thickness)/steps;
            let alpha = 1/steps;//these naturaly stack, so scaling with step is not needed
            for(let step = 0; step < steps; step++){
                this.data.graphics.lineStyle(lineStyle.thickness + (thicknessStep*step), 0xffffff, alpha);
                this.data.graphics.moveTo(0, 0);
                this.data.graphics.lineTo(this.data.boardView.outerSideLength, 0);
            }
            this.data.text.text = this.data.model.score;
            this.data.text.visible = true;
        }else{
            this.data.text.visible = false;
        }
        //temp disable score display
        this.data.text.visible = false;
        //doing this last means it sits on top of the hightligh
        this.data.graphics.lineStyle(lineStyle.thickness, colour, lineStyle.alpha);
        this.data.graphics.moveTo(0, 0);
        this.data.graphics.lineTo(this.data.boardView.outerSideLength, 0);
    }

    //this feels like its leaking the model a bit?
    manualCombine(first_team, second_team){
        function logError(){
            console.log("errror, invalid teams for combining sides");
            console.log(first_team);
            console.log(second_team);
        }
        if(first_team.number > second_team.number){
            let temp = first_team;
            first_team = second_team;
            second_team = temp;
        }
        if(first_team.number === second_team.number){
            return first_team.colour;
        }else if(first_team.number === 0 && second_team.number === 1){
                return combinedColours.team_0_1;
        }else if(first_team.number === 1 && second_team.number === 2){
                return combinedColours.team_1_2;
        }else if(first_team.number === 0 && second_team.number === 2){
                return combinedColours.team_2_0;
        }else{
            logError();
        }
    }
}
