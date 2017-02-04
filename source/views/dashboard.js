import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";

export class Dashboard extends Phaser.Sprite{
    //depending on what thee controls look like
    //might be better to make this with normal html/css
    constructor(game, x, y, width, teamInfo, boardModel){
        super(game, x, y);
        this.data.teamInfo = teamInfo;
        this.data.width = width;
        this.data.height = game.height;
        this.outline();
        this.data.teamsDisplay = [];
        for(let [index, team] of teamInfo.teams.entries()){
            let teamDisplayGroup = this.teamHighlights(team, index*50, 50, 30, 30);
            this.data.teamsDisplay.push(teamDisplayGroup);
            this.addChild(teamDisplayGroup);
        }
        this.data.boardModel = boardModel;
        this.moveCounter = new Phaser.Graphics(game, 0, this.data.height/2);
        this.addChild(this.moveCounter);
        this.data.highlighedSectionScore = new Phaser.Text(game, 0, 10, "", {wordWrap: true, wordWrapWidth: width, fontSize: 15});
        this.addChild(this.data.highlighedSectionScore);
    }

    teamHighlights(team, x, y, width, height){
        let group = new Phaser.Group(this.game, this);
        let teamHighlight = new Phaser.Graphics(this.game, x, y);
        teamHighlight.beginFill(team.colour);
        teamHighlight.drawRect(0,0, width, height);
        teamHighlight.endFill();
        teamHighlight.inputEnabled = true;
        teamHighlight.events.onInputOver.add(function(){
            this.data.boardModel.teamHighlight(team);
        }, this);
        group.addChild(teamHighlight);
        let scoreText = new Phaser.Text(this.game, x, y, "");
        group.addChild(scoreText);
        scoreText.update = function(){
            this.text = team.score;
        };
        return group;
    }

    outline(){
        this.data.outline = new Phaser.Graphics(this.game, 0, 0);
        this.data.outline.beginFill('0xff6600');
        this.data.outline.drawRect(0,0, this.data.width, this.data.height);
        this.data.outline.endFill();
        this.addChild(this.data.outline);
    }

    update(){
        for(let teamDisplayGroup of this.data.teamsDisplay){
            teamDisplayGroup.update();
        }
        this.moveCounter.clear();
        let score;
        if(this.data.boardModel.selected === undefined){
            score = 0;
        }else{
            score = this.data.boardModel.selected.score;
        }
        this.data.highlighedSectionScore.text = "Highlighted Score: " + score;
        const currentTeam = this.data.teamInfo.currentTeam;
        const moveLimit = this.data.teamInfo.settings.standardMoveLimit;
        this.moveCounter.beginFill(currentTeam.colour);
        let radius = Math.min(this.data.width, this.data.height)/2;
        let center = {x: this.data.width/2, y: 0};
        if(currentTeam.movesLeft == moveLimit){
            //arc draws in discreat segments, so leaves a gap for full circles
            this.moveCounter.drawCircle(center.x, center.y, radius*2);
        }else{
            let percentOfCircle = currentTeam.movesLeft/moveLimit;
            let endAngleRadians = -Math.PI*2*percentOfCircle;
            let topOffset = -Math.PI/2;
            this.moveCounter.arc(center.x, center.y, radius, topOffset, topOffset+endAngleRadians, true, 128);
        }
        this.moveCounter.endFill();
    }
}
