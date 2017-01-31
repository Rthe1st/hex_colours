export class CombinedSideCord{
    constructor(x, y, side){
        this.x = x;
        this.y = y;
        this.side = side;
    }

    equals(combinedSideCord){
         let isSameCord = this.x === combinedSideCord.x && this.y === combinedSideCord.x && this.side === combinedSideCord.side;
         let opposite = oppositeHexagon(this.x, this.y, this.side);
         let isOppositeCord = opposite.x === combinedSideCord.x && opposite.y === combinedSideCord.x && opposite.side === combinedSideCord.side;
         return isSameCord || isOppositeCord;
    }
}

export function getAdjacentHexagonOffset(gridX, side){
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

export function oppositeHexagon(combinedSideCord){
    let oppositeOffset = getAdjacentHexagonOffset(combinedSideCord.x, combinedSideCord.side);
    return new CombinedSideCord(combinedSideCord.x + oppositeOffset.x, combinedSideCord.y + oppositeOffset.y, (combinedSideCord.side+3)%6);
}
