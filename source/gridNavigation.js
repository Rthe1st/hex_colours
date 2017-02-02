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
