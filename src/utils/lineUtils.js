// lineUtils.js

export function updateLinePoints(line, lineStartedAtBlock, isHorizontalMove) {
    if (line.points.length < 2) return
    let newPoints
    if (lineStartedAtBlock) {
        newPoints = [line.points[0]]
        for (let i = 0; i < line.points.length - 1; i++) {
            const currentPoint = line.points[i]
            const nextPoint = line.points[i + 1]

            // Add the current point
            newPoints.push(currentPoint)

            // Add intermediate points to maintain right-angle connections only if necessary
            if (currentPoint.x !== nextPoint.x && currentPoint.y !== nextPoint.y) {
                if (isHorizontalMove) {
                    const midPoint = {
                        x: currentPoint.x,
                        y: nextPoint.y,
                        blockId: null
                    }
                    newPoints.push(midPoint)
                } else {
                    const midPoint = {
                        x: nextPoint.x,
                        y: currentPoint.y,
                        blockId: null
                    }
                    newPoints.push(midPoint)
                }
            }
        }

        newPoints.push(line.points[line.points.length - 1])
    } else {
        newPoints = [line.points[line.points.length - 1]]
        for (let i = line.points.length - 1; i > 0; i--) {
            const currentPoint = line.points[i]
            const nextPoint = line.points[i - 1]

            // Add the current point
            newPoints.push(currentPoint)

            // Add intermediate points to maintain right-angle connections only if necessary
            if (currentPoint.x !== nextPoint.x && currentPoint.y !== nextPoint.y) {
                if (isHorizontalMove) {
                    const midPoint = {
                        x: currentPoint.x,
                        y: nextPoint.y,
                        blockId: null
                    }
                    newPoints.push(midPoint)
                } else {
                    const midPoint = {
                        x: nextPoint.x,
                        y: currentPoint.y,
                        blockId: null
                    }
                    newPoints.push(midPoint)
                }
            }
        }

        newPoints.push(line.points[0])
        // keep original direction
        newPoints.reverse()
    }

    // Return the updated line points
    return cleanUpPoints(newPoints)
}

// function cleanUpPoints(points) {

//     if (points.length <= 2) return points

//     const newPoints = [points[0]]

//     for (let i = 1; i < points.length - 1; i++) {
//         const prevPoint = newPoints[newPoints.length - 1]
//         const currentPoint = points[i]
//         const nextPoint = points[i + 1]

//         // Check if the current point is necessary
//         // CHECK IF POINT IS ALONG STRAIGHT LINE
//         const isHorizontal = prevPoint.y === currentPoint.y && currentPoint.y === nextPoint.y
//         const isVertical = prevPoint.x === currentPoint.x && currentPoint.x === nextPoint.x

//         // Prevent points connected to blocks from being removed
//         // IF IS HORIZONAL OR VERTICAL, DONT ADD
//         // IF CONNECTED TO BLOCK, ADD

//         if (currentPoint.blockId || (!isHorizontal && !isVertical)) {
//             // Avoid adding duplicate points
//             if (currentPoint.x !== prevPoint.x || currentPoint.y !== prevPoint.y) {
//                 newPoints.push(currentPoint)
//             }
//         }
//     }

//     // Ensure the last point is always added and avoid duplicates
//     const lastPoint = points[points.length - 1]
//     const lastNewPoint = newPoints[newPoints.length - 1]
//     if (lastPoint.x == lastNewPoint.x && lastPoint.y == lastNewPoint.y) {
//         if (lastPoint?.blockId || lastPoint?.connectionPointId) {
//             newPoints[newPoints.length - 1] = lastPoint
//         }
//     } else if (!(lastNewPoint.blockId || lastNewPoint.connectionPointId) && (lastPoint.blockId || lastPoint.connectionPointId)) {
//         newPoints.push(lastPoint)
//     } else if (newPoints.length == 1) {
//         newPoints.push(lastPoint)
//     }

//     return newPoints
// }

function cleanUpPoints(points) {
    if (points.length <= 2) return points

    const newPoints = [points[0]]

    for (let i = 1; i < points.length - 1; i++) {
        const prevPoint = newPoints[newPoints.length - 1]
        const currentPoint = points[i]
        const nextPoint = points[i + 1]

        const isHorizontal = prevPoint.y === currentPoint.y && currentPoint.y === nextPoint.y
        const isVertical = prevPoint.x === currentPoint.x && currentPoint.x === nextPoint.x

        if (currentPoint.blockId || (!isHorizontal && !isVertical)) {
            if (currentPoint.x !== prevPoint.x || currentPoint.y !== prevPoint.y) {
                newPoints.push(currentPoint)
            }
        }
    }

    const lastPoint = points[points.length - 1]
    const lastNewPoint = newPoints[newPoints.length - 1]

    if (lastPoint.x !== lastNewPoint.x || lastPoint.y !== lastNewPoint.y) {
        newPoints.push(lastPoint)
    } else if (lastPoint?.blockId || lastPoint?.connectionPointId) {
        newPoints[newPoints.length - 1] = lastPoint
    }

    return newPoints
}