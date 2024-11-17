// src/stores/svgStore.js
import { defineStore } from 'pinia'
import { uuid } from 'vue-uuid'
import * as pdfMake from 'pdfmake/build/pdfmake'
// PDF Fonts
const pdfFonts = {
  // download default Roboto font from cdnjs.com
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
}
import {
  DragLineSegmentCommand,
  DeleteBlockCommand,
  DeleteLineCommand,
  AddLinePointCommand,
  StopDrawingCommand,
  DeleteTextCommand,
  AddRectangleCommand,
  DeleteRectangleCommand,
  AddBlockCommand,
  DeleteConnectionPointCommand,
  AddConnectionPointCommand,
  AddTextCommand,
  MoveRectangleCommand,
  MoveTextCommand,
  MoveConnectionPointCommand
} from '@/commands'
import { useHistoryStore } from './history'

const historyStore = useHistoryStore()

export const useSvgStore = defineStore('svgStore', {
  state: () => ({
    elementTypes: [
      { prop: 'rectangles', type: 'rectangle' },
      { prop: 'texts', type: 'text' },
      { prop: 'lines', type: 'line' },
      { prop: 'paths', type: 'path' },
      { prop: 'blocks', type: 'block' },
    ],
    blocks: [],
    lines: [],
    selectedBlock: null,
    selectedLine: null, // Add this
    isDrawing: false,
    lineType: 'solid',
    lineColor: '#000000',
    currentLine: [],
    activeTool: null,
    svg: null,
    viewBox: { x: 0, y: 0, width: 0, height: 0 },
    zoomLevel: 1,
    gridSize: 10,
    showGrid: true,
    initialViewBox: { width: 0, height: 0 },
    dragStart: { x: 0, y: 0 },
    dragging: false,
    selectedLineSegment: null,
    draggingLine: null,
    originalPoints: [],
    currentMoveBlockCommand: null,
    movingBlock: null,
    movingRect: null,
    mouseDown: false,
    mouseDownLine: null,
    mouseDownBlock: null,
    mouseDownRect: null,
    isDragging: false,
    isLineDragging: false,
    isBlockDragging: false,
    isRectDragging: false,
    panning: false,
    wireEnd: null,
    wireStart: null,
    hoverPoint: { x: null, y: null },
    isCreatingRectangle: false,
    currentRectangle: null,
    rectangles: [],
    rectangleStartPoint: { x: null, y: null },
    selectedText: null,
    selectedRectangle: null,
    texts: [],
    axezContainer: null,
    isAddingConnectionPoint: false,
    currentPoint: { x: 0, y: 0 },
    droppedBlock: false,
    droppedRect: false,
    connectionPoints: [],
    mode: null,
    selectedConnectionPoint: null,
    pendingTemplateData: null,
    tempBlock: null,
    paths: [],
    droppedTemplate: false,
    templateDropOffset: { x: 0, y: 0 },
    selectedObject: null,
    currentMoveRectCommand: null,
    mouseDownCP: null,
    isCPDragging: false,
    selectedCP: null,
    droppedCP: null,
    movingCP: null,
    currentMoveCPCommand: null,
    movingCP: null,
    isTextDragging: false,
    selectedText: null,
    droppedText: null,
    movingText: null,
    currentMoveTextCommand: null,
    movingText: null,
    initialRectPosition: { x: 0, y: 0 },
    initialCPPosition: { x: 0, y: 0 },
    initialTextPosition: { x: 0, y: 0 },
    conductorTableHeadings: [
      { title: 'alias', key: 'alias', editable: false, width: '60px' },
      { title: 'run', key: 'run', editable: false, width: '60px' },
      { title: 'voltage', key: 'voltage', editable: false, width: '80px' },
      { title: 'current', key: 'current', editable: true, width: '80px' },
      { title: 'vd', key: 'vd', editable: false, width: '60px' },
      { title: 'ccc', key: 'ccc', editable: false, width: '60px' },
      { title: 'egc', key: 'egc', editable: false, width: '60px' },
      { title: 'ocpd', key: 'ocpd', editable: false, width: '60px' },
      { title: 'size', key: 'size', editable: false, width: '80px' },
      { title: 'conductor', key: 'conductor', editable: false, width: '100px' },
      { title: 'ohms', key: 'ohms', editable: false, width: '80px' },
    ]
  }),
  actions: {
    handleSvgClick(event) {
      if (
        !this.activeTool &&
        !event.target.closest('rect') &&
        !event.target.closest('path') &&
        !event.target.closest('text') &&
        !event.target.closest('circle') &&
        !event.target.closest('foreignObject')
      ) {
        this.deselectAll()
      }
      if (this.droppedBlock) {
        this.endBlockDrag()
      }
      if (this.droppedTemplate) {
        const coords = this.getSVGCoordinates(event)
        this.endTemplateDrop(coords)
      }
      if (this.isAddingConnectionPoint) {
        this.startAddConnectionPoint(event)
      }
      if (this.isDrawing) {
        const coords = this.getSVGCoordinates(event)
        this.addPoint(coords, event.ctrlKey)
      }
      if (this.activeTool == 'rectangle' && this.isCreatingRectangle) {
        this.endRectangle(event)
      } else if (this.activeTool == 'rectangle') {
        this.startRectangle(event)
      }
      if (this.activeTool === 'text') {
        const coords = this.getSVGCoordinates(event)
        let text = this.createText(coords)
        historyStore.executeCommand(new AddTextCommand(text, this))
      }
      if (this.activeTool === 'connectionPoint' && this.selectedBlock) {
        const coords = this.getSVGCoordinates(event)
        let text = this.createText(coords)
        historyStore.executeCommand(new AddTextCommand(text, this))
      }
    },
    startRectangle(event) {
      const coords = this.getSVGCoordinates(event)
      const snappedCoords = this.snapToGrid(coords.x, coords.y)
      this.startCreatingRectangle(snappedCoords)
    },
    endRectangle() {
      if (this.isCreatingRectangle) {
        historyStore.executeCommand(new AddRectangleCommand(this.currentRectangle, this))
      }
    },
    selectConnectionPoint(cp) {
      if (!this.activeTool) {
        this.selectedConnectionPoint = cp
        this.selectObject(this.selectedConnectionPoint)
      }
    },
    setMode(mode) {
      this.mode = mode
    },
    startConnectionPointsTool() {
      this.activeTool = 'connectionPoints'
      this.isAddingConnectionPoint = true
    },
    startAddConnectionPoint(event) {
      if (this.mode !== 'block') {
        return
      }
      const coords = this.getSVGCoordinates(event)
      // const snappedCoords = this.snapToGrid(coords.x, coords.y);
      // this.selectedBlock.connectionPoints.push({
      //   id: Date.now().toString(),
      //   x: snappedCoords.x - this.selectedBlock.x,
      //   y: snappedCoords.y - this.selectedBlock.y
      // });
      //const snappedCoords = this.snapToGrid(coords.x - this.selectedBlock.x, coords.y - this.selectedBlock.y);
      const snappedCoords = this.snapToGrid(coords.x, coords.y)
      // this.selectedBlock.connectionPoints.push({
      //   id: Date.now().toString(),
      //   x: snappedCoords.x,
      //   y: snappedCoords.y
      // });

      let cp = {
        object: 'connectionPoint',
        id: uuid.v1(),
        x: snappedCoords.x,
        y: snappedCoords.y,
        voltage: null,
        connectionType: null
      }
      historyStore.executeCommand(new AddConnectionPointCommand(cp, this))
      this.endDrawing()
    },
    addConnectionPoint(cp) {
      this.connectionPoints.push(cp)
    },
    moveCP(cp, dx, dy) {
      const index = this.connectionPoints.findIndex((c) => c.id === cp.id)
      if (index !== -1) {
        // Update the block position
        this.connectionPoints[index].x += dx
        this.connectionPoints[index].y += dy
      }
    },
    startCPMove(cp, event) {
      this.movingCP = cp
      if (this.droppedCP) {
        const coords = this.getSVGCoordinates(event)
        cp.x = coords.x
        cp.y = coords.y
      }
    },
    endCPDrag() {
      historyStore.executeCommand(new MoveConnectionPointCommand(this.movingCP, this.movingCP.x - this.initialCPPosition.x, this.movingCP.y - this.initialCPPosition.y, this))

      //start rect dragging
      this.mouseDown = false
      this.mouseDownCP = null
      this.dragging = false
      this.isCPDragging = false
      this.movingCP = null
    },
    updateCurrentPoint(event) {
      const coords = this.getSVGCoordinates(event)
      const snappedCoords = this.snapToGrid(coords.x, coords.y)
      this.currentPoint = snappedCoords
    },
    deleteConnectionPoint(cp) {
      this.connectionPoints = this.connectionPoints.filter((c) => c.id !== cp.id)
      if (this.selectedConnectionPoint && this.selectedConnectionPoint.id === cp.id) {
        this.selectedConnectionPoint = null
      }
    },
    clearAxes() {
      if (this.axesContainer) {
        this.axesContainer.innerHTML = ''
      }
    },
    startTextTool() {
      this.activeTool = 'text'
    },
    createText(start, content = 'New Text') {
      if (this.activeTool !== 'text') return
      const snappedStart = this.snapToGrid(start.x, start.y)
      const newText = {
        object: 'text',
        id: uuid.v1(),
        x: snappedStart.x,
        y: snappedStart.y,
        content,
        fontSize: 16
      }
      return newText
    },
    addText(newText) {
      this.texts.push(newText)
      this.selectText(newText)
      this.endDrawing()
    },
    deleteText(text) {
      this.texts = this.texts.filter((t) => t.id !== text.id)
      if (this.selectedText && this.selectedText.id === text.id) {
        this.selectedText = null
      }
    },
    selectText(text) {
      if (!this.activeTool) {
        this.selectedText = text
        this.selectObject(this.selectedText)
      }
    },
    moveText(text, dx, dy) {
      const index = this.texts.findIndex((t) => t.id === text.id)
      if (index !== -1) {
        // Update the block position
        this.texts[index].x += dx
        this.texts[index].y += dy
      }
    },
    startTextMove(text, event) {
      this.movingText = text
      if (this.droppedText) {
        const coords = this.getSVGCoordinates(event)
        text.x = coords.x
        text.y = coords.y
      }
    },
    endTextDrag() {
      historyStore.executeCommand(new MoveTextCommand(this.movingText, this.movingText.x - this.initialTextPosition.x, this.movingText.y - this.initialTextPosition.y, this))

      //start rect dragging
      this.mouseDown = false
      this.mouseDownText = null
      this.dragging = false
      this.isTextDragging = false
      this.movingText = null
    },
    updateTextSize(newSize) {
      if (this.selectedText) {
        this.selectedText.fontSize = newSize
      }
    },
    updateTextContent(content) {
      if (this.selectedText) {
        this.selectedText.content = content
      }
    },
    startRectangleTool() {
      this.activeTool = 'rectangle'
      this.currentRectangle = null
    },
    startCreatingRectangle(start) {
      if (this.activeTool !== 'rectangle') return
      this.isCreatingRectangle = true
      this.rectangleStartPoint = { x: start.x, y: start.y }
      this.currentRectangle = {
        object: 'rectangle',
        id: uuid.v1(),
        x: start.x,
        y: start.y,
        width: 0,
        height: 0,
        color: 'rgba(240, 240, 240, 0.5)',
        stroke: 'black',
        strokeWidth: 1
      }
    },
    startRectMove(rect, event) {
      this.movingRect = rect
      if (this.droppedRect) {
        const coords = this.getSVGCoordinates(event)
        rect.x = coords.x
        rect.y = coords.y
      }
    },
    endRectDrag() {

      historyStore.executeCommand(new MoveRectangleCommand(this.movingRect, this.movingRect.x - this.initialRectPosition.x, this.movingRect.y - this.initialRectPosition.y, this))


      //start rect dragging
      this.mouseDown = false
      this.mouseDownRect = null
      this.dragging = false
      this.isRectDragging = false
      this.movingRect = null
    },
    updateRect(rect) {

      const rectIndex = this.rectangles.findIndex((r) => r.id === rect.id)
      if (rectIndex !== -1) {
        this.rectangles[rectIndex] = rect
      }
    },
    moveRect(rect, dx, dy) {
      const index = this.rectangles.findIndex((r) => r.id === rect.id)
      if (index !== -1) {
        // Update the block position
        this.rectangles[index].x += dx
        this.rectangles[index].y += dy
      }
    },
    updateCurrentRectangle(end) {
      if (this.activeTool !== 'rectangle' || !this.isCreatingRectangle) return
      const startX = this.rectangleStartPoint.x
      const startY = this.rectangleStartPoint.y
      const width = end.x - startX
      const height = end.y - startY

      if (width < 0) {
        this.currentRectangle.x = end.x
        this.currentRectangle.width = Math.abs(width)
      } else {
        this.currentRectangle.x = startX
        this.currentRectangle.width = width
      }

      if (height < 0) {
        this.currentRectangle.y = end.y
        this.currentRectangle.height = Math.abs(height)
      } else {
        this.currentRectangle.y = startY
        this.currentRectangle.height = height
      }
    },
    addRectangle(currentRectangle) {
      this.isCreatingRectangle = false
      this.rectangles.push(currentRectangle)
      this.currentRectangle = null
      this.endDrawing()
    },
    selectRectangle(rect) {
      if (!this.activeTool) {
        this.selectedRectangle = rect
        this.selectObject(this.selectedRectangle)
      }
    },
    cancelCreatingRectangle() {
      this.isCreatingRectangle = false
      this.currentRectangle = null
      this.activeTool = null
    },
    deleteRectangle(rect) {
      this.rectangles = this.rectangles.filter((r) => r.id !== rect.id)
      if (this.selectedRectangle && this.selectedRectangle.id === rect.id) {
        this.selectedRectangle = null
      }
    },
    endDrawing() {
      this.activeTool = null
      this.deselectAll()
      if (this.droppedBlock) {
        this.cancelBlockDrop()
      }
      if (this.isDrawing) {
        historyStore.executeCommand(new StopDrawingCommand(this))
        this.isAddingConnectionPoint = false
        this.stopDrawing()
      }
      if (this.isAddingConnectionPoint) {
        this.isAddingConnectionPoint = false
        this.currentPoint = { x: 0, y: 0 }
      }
    },
    finishWire() {
      if (this.wireStart && this.wireEnd) {
        this.wireStart = null
        this.wireEnd = null
        this.drawingWire = false
        this.endDrawing()
      }
    },
    startWire(cp, block, event) {
      if (this.isDrawing) {
        if (this.drawingWire) {
          this.wireEnd = { block, cp }
          const endPoint = {
            x: this.wireEnd.block.x + this.wireEnd.cp.x,
            y: this.wireEnd.block.y + this.wireEnd.cp.y,
            blockId: this.wireEnd.block.id,
            connectionPointId: this.wireEnd.cp.id
          }
          this.addPoint(endPoint, event.ctrlKey)
          this.finishWire()
        } else {
          this.drawingWire = true
          this.wireStart = { block, cp }
          const startPoint = {
            x: this.wireStart.block.x + this.wireStart.cp.x,
            y: this.wireStart.block.y + this.wireStart.cp.y,
            blockId: this.wireStart.block.id,
            connectionPointId: this.wireStart.cp.id
          }
          this.addPoint(startPoint, event.ctrlKey)
        }
      }
    },
    addPoint(point, ctrlKey) {
      const lastPoint = this.currentLine[this.currentLine.length - 1]
      let { x, y } = point
      if (lastPoint && !ctrlKey) {
        const dx = Math.abs(x - lastPoint.x)
        const dy = Math.abs(y - lastPoint.y)
        if (dx > dy) y = lastPoint.y
        else x = lastPoint.x
      }
      const snappedPoint = this.snapToGrid(x, y)
      const updatedPoint = { ...point, ...snappedPoint }
      historyStore.executeCommand(new AddLinePointCommand(this, updatedPoint))
    },
    endInteraction(event) {

      this.panning = false
      if (this.isLineDragging) {
        this.endLineDrag()
      }
      if (this.droppedBlock || this.isBlockDragging) {
        this.endBlockDrag()
      }

      if (this.isRectDragging) {
        this.endRectDrag()
      }

      if (this.isCPDragging) {
        this.endCPDrag()
      }

      if (this.isTextDragging) {
        this.endTextDrag()
      }

      if (this.droppedTemplate || this.isBlockDragging) {
        this.endTemplateDrop(event)
      }


      this.clearInteractionStore()
    },
    addBlock(block) {
      const blockExists = this.blocks.some((existingBlock) => existingBlock.id === block.id)
      if (!blockExists) {
        this.blocks.push(block)
      }
    },
    scaleBlock(block, scale) {
      const index = this.blocks.findIndex((b) => b.id === block.id)
      if (index !== -1) {
        const currentBlock = this.blocks[index]

        // Store original dimensions and content if not already stored
        if (currentBlock.originalWidth == null) {
          currentBlock.originalWidth = currentBlock.width
        }
        if (currentBlock.originalHeight == null) {
          currentBlock.originalHeight = currentBlock.height
        }
        if (currentBlock.originalContent == null) {
          currentBlock.originalContent = currentBlock.content
        }

        // Update the block's scale
        currentBlock.scale = scale

        // Scale the SVG content based on the original content
        let scaledSvgContent = this.scaleSvgContent(currentBlock.originalContent, scale)
        currentBlock.content = scaledSvgContent

        // Compute new width and height based on original dimensions
        currentBlock.width = currentBlock.originalWidth * scale
        currentBlock.height = currentBlock.originalHeight * scale
      }
    },
    moveBlock(block, dx, dy) {
      const index = this.blocks.findIndex((b) => b.id === block.id)
      if (index !== -1) {
        // Update the block position
        this.blocks[index].x += dx
        this.blocks[index].y += dy

        // Determine if the block movement is primarily horizontal or vertical
        const isHorizontalMove = Math.abs(dx) > Math.abs(dy)

        // Update connected wires
        this.lines.forEach((line) => {
          let lineStartedAtBlock = false
          line.points.forEach((point) => {
            if (point?.blockId === block.id) {
              let lineIndex = line.points.findIndex((p) => p.blockId === block.id)
              if (lineIndex === 0) {
                lineStartedAtBlock = true
              }
              point.x += dx
              point.y += dy
            }
          })

          // Update line points to add/remove intermediate points
          this.updateLinePoints(line, lineStartedAtBlock, isHorizontalMove)
        })
      }
    },
    startBlockMove(block, event) {
      this.movingBlock = block
      if (this.droppedBlock) {
        const coords = this.getSVGCoordinates(event)
        block.x = coords.x
        block.y = coords.y
      }
    },
    //I think what this does is replace the objects with the stored objects, not just update their props
    updateBlockAndLines(block, lines) {
      const blockIndex = this.blocks.findIndex((b) => b.id === block.id)
      if (blockIndex !== -1) {
        this.blocks[blockIndex] = block
      }

      lines.forEach((updatedLine) => {
        const lineIndex = this.lines.findIndex((line) => line.id === updatedLine.id)
        if (lineIndex !== -1) {
          this.lines[lineIndex].points = updatedLine.points
        }
      })
    },

    scaleSvgContent(svgContent, scaleFactor) {
      const parser = new DOMParser()
      const serializer = new XMLSerializer()
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
      const svgElement = svgDoc.documentElement

      // Adjust the viewBox
      const viewBoxAttr = svgElement.getAttribute('viewBox')
      if (viewBoxAttr) {
        const viewBoxValues = viewBoxAttr.split(' ').map(parseFloat)
        const [minX, minY, width, height] = viewBoxValues
        const newViewBox = `${minX} ${minY} ${width * scaleFactor} ${height * scaleFactor}`
        svgElement.setAttribute('viewBox', newViewBox)
      }

      // Scale the width and height attributes
      ['width', 'height'].forEach(attr => {
        if (svgElement.hasAttribute(attr)) {
          const value = svgElement.getAttribute(attr)
          // Extract numerical value and unit (e.g., '16.361509mm' -> 16.361509, 'mm')
          const match = value.match(/^([\d.]+)([a-z%]*)$/)
          if (match) {
            const numericValue = parseFloat(match[1]) * scaleFactor
            const unit = match[2] || ''
            svgElement.setAttribute(attr, `${numericValue}${unit}`)
          }
        }
      })

      // Create a new <g> element with the scaling transform
      const gElement = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g')
      const scaleValue = scaleFactor
      gElement.setAttribute('transform', `scale(${scaleValue})`)

      // Move all children of the SVG element into the <g> element
      while (svgElement.firstChild) {
        gElement.appendChild(svgElement.firstChild)
      }

      // Append the <g> element back into the SVG element
      svgElement.appendChild(gElement)

      // Do not adjust viewBox or width/height in this case

      // Serialize the modified SVG back to a string
      return serializer.serializeToString(svgDoc)
    },

    scaleSvgContent_unused(svgContent, scaleFactor) {
      const parser = new DOMParser()
      const serializer = new XMLSerializer()

      // Extract original width and height from the SVG string
      const widthMatch = svgContent.match(/<svg[^>]*\swidth="([^"]*)"/)
      const heightMatch = svgContent.match(/<svg[^>]*\sheight="([^"]*)"/)

      const originalWidth = widthMatch ? widthMatch[1] : null
      const originalHeight = heightMatch ? heightMatch[1] : null



      // Parse the SVG content
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
      const svgElement = svgDoc.documentElement

      // Function to adjust a dimension attribute (width or height)
      const adjustDimension = (dimension, originalValue) => {
        if (originalValue) {
          const unitRegex = /^([0-9.]+)([a-z%]*)$/i
          const match = unitRegex.exec(originalValue)
          if (match) {
            const number = parseFloat(match[1])
            const unit = match[2] || ''
            const newValue = number * scaleFactor
            svgElement.setAttribute(dimension, `${newValue}${unit}`)
          }
        }
      }

      // Adjust width and height using the original values converted to pixels
      adjustDimension('width', originalWidth)
      adjustDimension('height', originalHeight)

      // Adjust the viewBox
      const viewBoxAttr = svgElement.getAttribute('viewBox')
      if (viewBoxAttr) {
        const [minX, minY, width, height] = viewBoxAttr
          .split(/[\s,]+/)
          .map(parseFloat)
        const newViewBox = `${minX} ${minY} ${width * scaleFactor} ${height * scaleFactor}`
        svgElement.setAttribute('viewBox', newViewBox)
      }

      // Serialize the modified SVG back to a string
      return serializer.serializeToString(svgDoc)
    },



    updateLinePoints(line, lineStartedAtBlock, isHorizontalMove) {
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

      // Clean up points to remove unnecessary midpoints
      line.points = this.cleanUpPoints(newPoints)
    },

    cleanUpPoints(points) {
      if (points.length <= 2) return points

      const newPoints = [points[0]]

      for (let i = 1; i < points.length - 1; i++) {
        const prevPoint = newPoints[newPoints.length - 1]
        const currentPoint = points[i]
        const nextPoint = points[i + 1]

        // Check if the current point is necessary
        // CHECK IF POINT IS ALONG STRAIGHT LINE
        const isHorizontal = prevPoint.y === currentPoint.y && currentPoint.y === nextPoint.y
        const isVertical = prevPoint.x === currentPoint.x && currentPoint.x === nextPoint.x

        // Prevent points connected to blocks from being removed
        // IF IS HORIZONAL OR VERTICAL, DONT ADD
        // IF CONNECTED TO BLOCK, ADD

        if (currentPoint.blockId || (!isHorizontal && !isVertical)) {
          // Avoid adding duplicate points
          if (currentPoint.x !== prevPoint.x || currentPoint.y !== prevPoint.y) {
            newPoints.push(currentPoint)
          }
        }
      }

      // Ensure the last point is always added and avoid duplicates
      const lastPoint = points[points.length - 1]
      const lastNewPoint = newPoints[newPoints.length - 1]
      if (lastPoint.x == lastNewPoint.x && lastPoint.y == lastNewPoint.y) {
        if (lastPoint?.blockId || lastPoint?.connectionPointId) {
          newPoints[newPoints.length - 1] = lastPoint
        }
      } else if (!(lastNewPoint.blockId || lastNewPoint.connectionPointId) && (lastPoint.blockId || lastPoint.connectionPointId)) {
        newPoints.push(lastPoint)
      } else if (newPoints.length == 1) {
        newPoints.push(lastPoint)
      }

      return newPoints
    },
    getSVGCoordinates(event) {
      const { left, top } = this.svg.getBoundingClientRect()
      const svgPoint = this.svg.createSVGPoint()
      svgPoint.x = event.clientX
      svgPoint.y = event.clientY
      const point = svgPoint.matrixTransform(this.svg.getScreenCTM().inverse())
      return {
        x: point.x,
        y: point.y
      }
    },
    isPointOnSegment(point, startPoint, endPoint) {
      const buffer = 5 // Tolerance for clicking near the segment
      if (startPoint.x === endPoint.x) {
        // Vertical segment
        return (
          Math.abs(point.x - startPoint.x) <= buffer &&
          point.y >= Math.min(startPoint.y, endPoint.y) &&
          point.y <= Math.max(startPoint.y, endPoint.y)
        )
      } else if (startPoint.y === endPoint.y) {
        // Horizontal segment
        return (
          Math.abs(point.y - startPoint.y) <= buffer &&
          point.x >= Math.min(startPoint.x, endPoint.x) &&
          point.x <= Math.max(startPoint.x, endPoint.x)
        )
      }
      return false
    },
    deleteObject() {
      if (this.selectedBlock) {
        historyStore.executeCommand(new DeleteBlockCommand(this.selectedBlock, this))
      }
      if (this.selectedLine) {
        historyStore.executeCommand(new DeleteLineCommand(this.selectedLine, this))
      }
      if (this.selectedText) {
        historyStore.executeCommand(new DeleteTextCommand(this.selectedText, this))
      }
      if (this.selectedRectangle) {
        historyStore.executeCommand(new DeleteRectangleCommand(this.selectedRectangle, this))
      }
      if (this.selectedConnectionPoint) {
        historyStore.executeCommand(new DeleteConnectionPointCommand(this.selectedConnectionPoint, this))
      }
    },
    startLineDrag(line, event) {

      const coords = this.getSVGCoordinates(event)
      const segment = this.findLineSegment(line, coords)
      if (segment) {
        this.selectedLineSegment = segment
        this.dragStart = coords
        this.dragging = true

        this.draggingLine = line
        this.originalPoints = line.points.map((point) => ({ ...point }))

        // Highlight the selected segment
        //this.highlightSegment(segment.startPoint, segment.endPoint);
      }
    },
    endLineDrag() {
      if (this.draggingLine) {
        const finalPoints = this.draggingLine.points.map((point) => ({ ...point }))
        const command = new DragLineSegmentCommand(this.draggingLine, this.originalPoints, finalPoints, this)
        historyStore.executeCommand(command)
        this.draggingLine = null
        this.originalPoints = []
      }
    },
    findLineSegment(line, coords) {
      for (let i = 0; i < line.points.length - 1; i++) {
        const startPoint = line.points[i]
        const endPoint = line.points[i + 1]
        if (this.isPointOnSegment(coords, startPoint, endPoint)) {
          //this.highlightSegment(startPoint, endPoint); // Highlight the segment for debugging
          return { line, index: i, startPoint, endPoint }
        }
      }
      return null
    },
    highlightSegment(startPoint, endPoint) {
      const svgNS = 'http://www.w3.org/2000/svg'
      const line = document.createElementNS(svgNS, 'line')
      line.setAttribute('x1', startPoint.x)
      line.setAttribute('y1', startPoint.y)
      line.setAttribute('x2', endPoint.x)
      line.setAttribute('y2', endPoint.y)
      line.setAttribute('stroke', 'red')
      line.setAttribute('stroke-width', '4')
      line.setAttribute('id', 'highlighted-segment')

      // Remove existing highlight if any
      const existingHighlight = document.getElementById('highlighted-segment')
      if (existingHighlight) {
        existingHighlight.remove()
      }

      // Append the new highlight
      this.svg.appendChild(line)
    },
    dragSegment(segment, dx, dy) {
      const { line, startPoint, endPoint } = segment

      if (line.points.length == 2) {
        this.selectedLineSegment.index = 0
      }

      let index = segment.index

      // Check if the segment is connected to a block
      const isConnectedToBlock = startPoint.blockId || endPoint.blockId

      // Capture original first and last points of the line
      const originalFirstPoint = { ...line.points[0] }
      const originalLastPoint = { ...line.points[line.points.length - 1] }

      let actualStartPoint = line.points[index]
      let actualEndPoint = line.points[index + 1]

      //find which points are connected to end point
      const startPointConnectedToBlock = actualStartPoint?.blockId ? true : false
      const endPointConnectedToBlock = actualEndPoint?.blockId ? true : false

      // Determine if the segment is horizontal or vertical
      const isHorizontal = startPoint.y === endPoint.y
      const isVertical = startPoint.x === endPoint.x

      // Restrict movement based on segment orientation
      if (isHorizontal) {
        dx = 0 // No horizontal movement for horizontal segments
      } else if (isVertical) {
        dy = 0 // No vertical movement for vertical segments
      }

      // Calculate new positions for the segment's points
      const newStartPoint = { x: startPoint.x + dx, y: startPoint.y + dy }
      const newEndPoint = { x: endPoint.x + dx, y: endPoint.y + dy }

      // Snap the new positions to the grid
      const snappedStartPoint = this.snapToGrid(newStartPoint.x, newStartPoint.y)
      const snappedEndPoint = this.snapToGrid(newEndPoint.x, newEndPoint.y)

      // Add intermediate points to keep end points in place
      if (isHorizontal) {
        if (endPointConnectedToBlock && startPointConnectedToBlock) {
          // Both endpoints are connected to blocks

          if (snappedStartPoint.y !== startPoint.y) {
            if (line.points.length == 2) {

              line.points.splice(index + 1, 0, { x: snappedStartPoint.x, y: snappedStartPoint.y, blockId: '' })
              line.points.splice(index + 2, 0, { x: snappedEndPoint.x, y: snappedEndPoint.y, blockId: '' })
              this.selectedLineSegment.index = 1
            }
            if (line.points.length == 4) {
              line.points[1] = snappedStartPoint
              line.points[2] = snappedEndPoint
            }
          }

          if (snappedStartPoint.y == startPoint.y) {
            if (line.points.length == 4) {
              line.points.splice(1, 2)
            }
          }
        } else if (endPointConnectedToBlock) {
          line.points.splice(index + 1, 0, { x: endPoint.x, y: snappedEndPoint.y })
          // Update the points in the line only for the selected segment
          line.points[index] = snappedStartPoint
          line.points[index + 1] = snappedEndPoint
        } else if (startPointConnectedToBlock) {
          line.points.splice(1, 0, { x: endPoint.x, y: snappedEndPoint.y })
          line.points[1] = snappedStartPoint
          line.points[2] = snappedEndPoint
        } else if (!endPointConnectedToBlock && !startPointConnectedToBlock) {
          line.points[index] = { ...line.points[index], ...snappedStartPoint }
          line.points[index + 1] = { ...line.points[index + 1], ...snappedEndPoint }
        }
      }

      if (isVertical) {
        if (endPointConnectedToBlock && startPointConnectedToBlock) {
          // Both endpoints are connected to blocks

          if (snappedStartPoint.x !== startPoint.x) {
            if (line.points.length == 2) {
              line.points.splice(index + 1, 0, { x: snappedStartPoint.x, y: snappedStartPoint.y, blockId: '' })
              line.points.splice(index + 2, 0, { x: snappedEndPoint.x, y: snappedEndPoint.y, blockId: '' })
            }
            if (line.points.length == 4) {
              line.points[1] = snappedStartPoint
              line.points[2] = snappedEndPoint
            }
          }

          if (snappedStartPoint.x == startPoint.x) {
            if (line.points.length == 4) {
              line.points.splice(1, 2)
            }
          }
        } else if (endPointConnectedToBlock) {
          line.points.splice(index + 1, 0, { x: snappedEndPoint.x, y: endPoint.y })
          // Update the points in the line only for the selected segment
          line.points[index] = snappedStartPoint
          line.points[index + 1] = snappedEndPoint
        } else if (startPointConnectedToBlock) {
          line.points.splice(1, 0, { x: snappedEndPoint.x, y: endPoint.y })
          line.points[1] = snappedStartPoint
          line.points[2] = snappedEndPoint
        } else if (!endPointConnectedToBlock && !startPointConnectedToBlock) {
          line.points[index] = { ...line.points[index], ...snappedStartPoint }
          line.points[index + 1] = { ...line.points[index + 1], ...snappedEndPoint }
        }
      }

      // Reset the first and last points to the original block connection points
      this.resetEndPointsToOriginal(line, originalFirstPoint, originalLastPoint)
      // Redraw the line
      this.updateLinePoints(line, index === 0, Math.abs(dx) > Math.abs(dy))
      this.draggingLine = line
    },
    clearInteractionStore() {
      this.selectedLineSegment = this.draggingLine = this.movingBlock = null
      this.dragging = this.mouseDownBlock = false
    },
    resetEndPointsToOriginal(line, originalFirstPoint, originalLastPoint) {
      if (originalFirstPoint.blockId && originalFirstPoint.connectionPointId) {
        line.points[0] = originalFirstPoint
      }
      if (originalLastPoint.blockId && originalLastPoint.connectionPointId) {
        line.points[line.points.length - 1] = originalLastPoint
      }
    },
    snapToGrid(x, y) {
      return {
        x: Math.round(x / this.gridSize) * this.gridSize,
        y: Math.round(y / this.gridSize) * this.gridSize
      }
    },
    selectBlock(block) {
      if (!this.activeTool) {
        this.selectedBlock = block
        this.selectObject(this.selectedBlock)
      }
    },
    selectObject(obj) {
      this.selectedObject = obj
    },
    deleteBlock(block) {
      this.blocks = this.blocks.filter((b) => b.id !== block.id)
      if (this.selectedBlock && this.selectedBlock.id === block.id) {
        this.selectedBlock = null
      }
    },
    startDrawing() {
      this.isDrawing = true
      this.activeTool = `${this.lineType}-${this.lineColor}` // Set the active tool
    },
    addLine(line) {
      if (line) {
        this.lines.push(line)
      }
    },
    generateAlias(index) {
      let alias = ''
      while (index >= 0) {
        alias = String.fromCharCode((index % 26) + 65) + alias
        index = Math.floor(index / 26) - 1
      }
      return alias
    },
    updateAliases() {
      this.lines.forEach((line, index) => {
        line.alias = this.generateAlias(index)
      })
    },
    stopDrawing(line) {
      if (line) {
        this.addLine(line)
      } else if (this.currentLine.length > 1) {
        // Calculate the index for the new line
        const index = this.lines.length

        // Generate the alias using the index
        const alias = this.generateAlias(index)

        let newLine = {
          object: 'line',
          id: uuid.v1(),
          alias: alias,
          type: this.lineType,
          color: this.lineColor,
          points: [...this.currentLine],
        }

        this.addLine(newLine)
        this.currentLine = []
      }
      this.currentLine = []
      this.isDrawing = false
      this.clearAxes()
      this.endInteraction()
    },
    addLinePoint(point) {
      this.currentLine.push(point)
    },
    setLineType(type) {
      this.lineType = type
    },
    setLineColor(color) {
      this.lineColor = color
    },
    selectLine(line) {
      if (!this.activeTool) {
        this.selectedLine = line
        this.selectObject(this.selectedLine)
      }
    },
    deleteLine(line) {
      this.lines = this.lines.filter((l) => l.id !== line.id)
      if (this.selectedLine && this.selectedLine.id === line.id) {
        this.selectedLine = null
      }
    },
    removeLastLinePoint() {
      if (this.currentLine.length > 0) {
        this.currentLine.pop()
      }
    },
    removeLastLine() {
      if (this.lines.length > 0) {
        this.lines.pop()
      }
    },
    serializeState() {
      return JSON.stringify({
        texts: this.texts,
        blocks: this.blocks,
        lines: this.lines,
        rectangles: this.rectangles,
        connectionPoints: this.connectionPoints,
        viewBox: this.viewBox,
        zoomLevel: this.zoomLevel
      })
    },
    svgToDataUrl(svgElement) {
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgElement)
      const encodedData = encodeURIComponent(svgString)
      return `data:image/svg+xml;charset=utf-8,${encodedData}`
    },
    deserializeState(serializedState) {
      const data = JSON.parse(serializedState)
      const { clientWidth, clientHeight } = this.svg
      this.initializeViewBox()
      this.blocks = data?.blocks || []
      this.rectangles = data?.rectangles || []
      this.lines = data?.lines || []
      this.texts = data?.texts || []
      this.zoomLevel = data?.zoomLevel || 1 // Restore the zoom level
      this.connectionPoints = data?.connectionPoints || []

      // Calculate the center of the old viewBox
      const centerX = (data?.viewBox?.x || 0) + (data?.viewBox?.width || this.initialViewBox.width) / 2
      const centerY = (data?.viewBox?.y || 0) + (data?.viewBox?.height || this.initialViewBox.height) / 2

      // Calculate the new viewBox dimensions based on the new zoom level
      const newWidth = this.initialViewBox.width / this.zoomLevel
      const newHeight = this.initialViewBox.height / this.zoomLevel

      // Calculate the new viewBox position to center the viewBox around the saved center
      const newX = centerX - newWidth / 2
      const newY = centerY - newHeight / 2

      // Update the viewBox in the store
      this.setViewBox(newX, newY, newWidth, newHeight)
    },
    startImportTemplate(template, event) {
      this.selectBlock(null)
      this.pendingTemplateData = template.drawing
      const drawing = JSON.parse(template.drawing)

      // const svg = template.project_svg;
      // const svgContent = decodeDataUri(svg);
      // const svgElement = parseSvgContent(svgContent);
      // const elements = extractElementsFromSvg(svgElement);

      const coords = this.getSVGCoordinates(event)
      const elements = []


      for (const { prop, type } of this.elementTypes) {
        // Check if block.elements exists and has the property
        if (drawing && Array.isArray(drawing[prop])) {
          const items = drawing[prop]
          elements.push(
            ...items.map((item) => ({
              ...item,
              type,
            }))
          )
        }
      }

      const { svg, connectionPoints, offset, boundingBox } = this.generateSVGContent(elements, drawing?.connectionPoints)
      this.templateDropOffset = offset

      let svgCenter = this.getSvgCenter()

      let width = Math.abs(boundingBox.minX - boundingBox.maxX)
      let height = Math.abs(boundingBox.minY - boundingBox.maxY)

      const tempBlock = {
        object: 'block',
        scale: template?.scale || 1,
        id: uuid.v1(),
        x: coords?.x || svgCenter?.x || 40, // Adjust the position as needed
        y: coords?.y || svgCenter?.y || 40, // Adjust the position as needed
        width: width || 80, // Adjust width and height as needed
        height: height || 80,
        originalWidth: width,
        originalHeight: height,
        color: '#f0f0f0', // Default color if not provided
        elements: elements,
        content: svg,
        connectionPoints: []
      }

      this.tempBlock = tempBlock
      this.blocks.push(tempBlock)
      this.startTemplateDrop(tempBlock)
    },
    importPendingTemplate(coords) {
      // Parse the template data
      const data = JSON.parse(this.pendingTemplateData)

      // Extract elements from the data
      const blocks = data?.blocks || []
      const rectangles = data?.rectangles || []
      const lines = data?.lines || []
      const texts = data?.texts || []

      // Update the UUID of each block
      const updatedBlocks = blocks.map((block) => ({
        ...block,
        id: uuid.v1(), // Generate a new UUID for the block
        connectionPoints: block.connectionPoints.map((cp) => ({
          ...cp,
          id: uuid.v1() // Generate a new UUID for each connection point
        })),
        x: block.x + coords.x,
        y: block.y + coords.y
      }))

      // Update the UUID of each rectangle
      const updatedRectangles = rectangles.map((rect) => ({
        ...rect,
        id: uuid.v1() // Generate a new UUID for the rectangle
      }))

      // Update the UUID of each line
      const updatedLines = lines.map((line) => ({
        ...line,
        id: uuid.v1(), // Generate a new UUID for the line
        points: line.points.map((point) => ({
          ...point,
          id: uuid.v1() // Generate a new UUID for each point (if applicable)
        }))
      }))

      // Update the UUID of each text
      const updatedTexts = texts.map((text) => ({
        ...text,
        id: uuid.v1() // Generate a new UUID for the text
      }))

      // Push the updated elements to the state
      this.blocks.push(...updatedBlocks)
      this.rectangles.push(...updatedRectangles)
      this.lines.push(...updatedLines)
      this.texts.push(...updatedTexts)
    },

    importBlock(data, event) {

      this.selectBlock(null)
      const block = data
      const drawing = JSON.parse(block.drawing)
      const elements = []

      for (const { prop, type } of this.elementTypes) {
        // Check if block.elements exists and has the property
        if (drawing && Array.isArray(drawing[prop])) {
          const items = drawing[prop]
          elements.push(
            ...items.map((item) => ({
              ...item,
              type,
            }))
          )
        }
      }

      const coords = this.getSVGCoordinates(event)

      const { svg, connectionPoints, offset, boundingBox } = this.generateSVGContent(elements, drawing?.connectionPoints)
      let svgCenter = this.getSvgCenter()
      let width = Math.abs(boundingBox.minX - boundingBox.maxX)
      let height = Math.abs(boundingBox.minY - boundingBox.maxY)
      const newBlock = {
        object: 'block',
        scale: block?.scale || 1,
        id: uuid.v1(),
        x: coords?.x || svgCenter?.x || 40, // Adjust the position as needed
        y: coords?.y || svgCenter?.y || 40, // Adjust the position as needed
        width: width || 80, // Adjust width and height as needed
        height: height || 80,
        originalWidth: width,
        originalHeight: height,
        color: block?.color || '#f0f0f0', // Default color if not provided
        elements: elements,
        content: svg,
        connectionPoints: connectionPoints || []
      }

      this.templateDropOffset = offset
      this.blocks.push(newBlock)
      this.startBlockDrop(newBlock)
    },
    getSvgCenter() {
      if (this?.svg) {
        const bbox = this.svg.getBBox()
        const centerX = bbox.x + bbox.width / 2
        const centerY = bbox.y + bbox.height / 2
        return { x: centerX, y: centerY }
      }
    },
    convertToPixels(value) {
      const unitRegex = /([0-9.]+)([a-z%]*)/i
      const match = unitRegex.exec(value)
      if (!match) return parseFloat(value)

      const number = parseFloat(match[1])
      const unit = match[2]

      switch (unit) {
        case 'mm':
          return (number * 96) / 25.4 // Convert millimeters to pixels
        case 'cm':
          return (number * 96) / 2.54 // Convert centimeters to pixels
        case 'in':
          return number * 96 // Convert inches to pixels
        case 'pt':
          return (number * 96) / 72 // Convert points to pixels
        case 'pc':
          return (number * 96) / 6 // Convert picas to pixels
        case 'em':
        case 'ex':
        case 'px':
        default:
          return number // Assume pixels if unit is 'px' or unknown
      }
    },
    importSvgAsBlock(svgContent, event) {
      const coords = this.getSVGCoordinates(event)

      // Create a temporary DOM parser to parse the SVG content
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
      const svgElement = svgDoc.documentElement

      // Extract the width and height attributes
      let widthAttr = svgElement.getAttribute('width')
      let heightAttr = svgElement.getAttribute('height')


      // Convert width and height to pixels
      const width = this.convertToPixels(widthAttr || '0')
      const height = this.convertToPixels(heightAttr || '0')
      let svgCenter = this.getSvgCenter()
      const newBlock = {
        object: 'block',
        scale: 1,
        id: uuid.v1(),
        x: coords?.x || svgCenter?.x || 40, // Adjust the position as needed
        y: coords?.y || svgCenter?.y || 40, // Adjust the position as needed
        width: width || 80, // Use extracted width or default
        height: height || 80, // Use extracted height or default
        originalWidth: width,
        originalHeight: height,
        color: '#f0f0f0',
        elements: null,
        content: svgContent,
        connectionPoints: [],
      }

      this.blocks.push(newBlock)
      this.startBlockDrop(newBlock)
    },
    startBlockDrop(newBlock) {
      //start block dragging
      this.mouseDown = true
      this.mouseDownBlock = newBlock
      this.selectBlock(newBlock)
      this.dragging = true
      this.droppedBlock = true
    },
    endBlockDrag() {
      // Finalize MoveBlockCommand and execute
      if (this.currentMoveBlockCommand) {
        const dx = this.movingBlock.x - this.currentMoveBlockCommand.originalBlockPosition.x
        const dy = this.movingBlock.y - this.currentMoveBlockCommand.originalBlockPosition.y
        this.currentMoveBlockCommand.dx = dx
        this.currentMoveBlockCommand.dy = dy
        this.currentMoveBlockCommand.execute()
        historyStore.executeCommand(this.currentMoveBlockCommand)
        this.currentMoveBlockCommand = null
      }
      //start block dragging
      if (this.droppedBlock) {
        historyStore.executeCommand(new AddBlockCommand(this.mouseDownBlock, this))
      }
      this.mouseDown = false
      this.mouseDownBlock = null
      this.dragging = false
      this.droppedBlock = false
      this.isBlockDragging = false
    },
    startTemplateDrop(newBlock) {
      //start block dragging
      this.mouseDown = true
      this.mouseDownBlock = newBlock
      this.selectBlock(newBlock)
      this.dragging = true
      this.droppedTemplate = true
    },
    endTemplateDrop(event) {
      //start block dragging

      if (event) {
        const coords = this.getSVGCoordinates(event)
        const offset = { x: coords.x - this.templateDropOffset.x, y: coords.y - this.templateDropOffset.y }
        this.importPendingTemplate(offset)
      }

      this.deleteBlock(this.tempBlock)
      this.mouseDown = false
      this.mouseDownBlock = null
      this.dragging = false
      this.droppedTemplate = false
      this.isBlockDragging = false
      this.tempBlock = null
      this.pendingTemplateData = null
    },
    cancelBlockDrop() {
      //start block dragging
      this.deleteBlock(this.mouseDownBlock)
      this.mouseDown = false
      this.mouseDownBlock = null
      this.dragging = false
      this.droppedBlock = false
      this.isBlockDragging = false
    },
    generateSVGContent(elements, connectionPoints) {
      // Separate the elements by type
      const lines = elements.filter((el) => el.type === 'line')
      const rectangles = elements.filter((el) => el.type === 'rectangle')
      const texts = elements.filter((el) => el.type === 'text')
      const paths = elements.filter((el) => el.type === 'path')
      const blocks = elements.filter((el) => el.type === 'block')

      // Calculate the bounding box for the elements
      const { minX, minY, maxX, maxY } = this.calculateBoundingBox(lines, blocks, rectangles, paths, texts)

      // Calculate normalized dimensions and viewBox
      const width = maxX - minX
      const height = maxY - minY
      const viewBox = `0 0 ${width} ${height}`

      // Normalize the coordinates of elements
      const normalizedElements = elements
        .map((element) => {
          if (element.type === 'rectangle') {
            return `<rect x="${element.x - minX}" y="${element.y - minY}" width="${element.width}" height="${element.height}" fill="${element.color}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}" />`
          } else if (element.type === 'text') {
            return `<text x="${element.x - minX}" y="${element.y - minY}" font-size="${element.fontSize}">${element.content}</text>`
          } else if (element.type === 'line') {
            if (element.points.length === 2) {
              return `<line x1="${element.points[0].x - minX}" y1="${element.points[0].y - minY}" x2="${element.points[1].x - minX}" y2="${element.points[1].y - minY}" stroke="${element.color}" stroke-dasharray="${element.type === 'dashed' ? '5,5' : 'none'}" />`
            } else {
              const points = element.points.map((point) => `${point.x - minX},${point.y - minY}`).join(' ')
              return `<polyline points="${points}" stroke="${element.color}" fill="none" stroke-width="${element.strokeWidth}" stroke-dasharray="${element.type === 'dashed' ? '5,5' : 'none'}" />`
            }
          } else if (element.type === 'path') {
            return `<path d="${normalizePath(element.d, minX, minY)}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}" fill="${element.fill}" />`
          }
        })
        .join('')


      // Include block contents directly into the SVG
      const normalizedBlocks = blocks
        .map((block) => {
          // Normalize block position
          const normalizedX = block.x - minX
          const normalizedY = block.y - minY

          // Parse the block's content into a DOM
          const parser = new DOMParser()
          const svgDoc = parser.parseFromString(block.content, 'image/svg+xml')
          const svgElement = svgDoc.documentElement

          // Set x and y attributes to position the nested SVG
          svgElement.setAttribute('x', normalizedX)
          svgElement.setAttribute('y', normalizedY)

          // Serialize back to string
          const serializer = new XMLSerializer()
          const svgString = serializer.serializeToString(svgElement)
          return svgString
        })
        .join('')

      let normalizedConnectionPoints = []
      // Normalize the coordinates of connection points
      if (connectionPoints) {
        normalizedConnectionPoints = connectionPoints.map((cp) => ({
          ...cp,
          x: cp.x - minX,
          y: cp.y - minY
        }))
      }

      // Generate the SVG content
      const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">`
      const svgFooter = '</svg>'
      return {
        svg: svgHeader + normalizedElements + normalizedBlocks + svgFooter,
        connectionPoints: normalizedConnectionPoints,
        offset: { x: minX, y: minY },
        boundingBox: { minX, minY, maxX, maxY }
      }
    },

    setSvgElement(svg) {
      this.svg = svg
    },
    setAxesContainer(element) {
      this.axesContainer = element
    },
    setViewBox(x, y, width, height) {
      this.viewBox = { x, y, width, height }
      this.zoomLevel = this.initialViewBox.width / width // Update zoomLevel based on the new viewBox dimensions
    },
    // initializeViewBox() {
    //   if (this.svg) {
    //     const { clientWidth, clientHeight } = this.svg;
    //     this.viewBox.x = 0;
    //     this.viewBox.y = 0;
    //     this.viewBox.width = clientWidth;
    //     this.viewBox.height = clientHeight;
    //     this.zoomLevel = 1;
    //   }
    // },
    initializeViewBox() {
      if (this.svg) {
        const { clientWidth, clientHeight } = this.svg
        this.viewBox = { x: 0, y: 0, width: clientWidth, height: clientHeight }
        this.initialViewBox = { width: clientWidth, height: clientHeight } // Initialize the initial viewBox dimensions
      }
    },
    centerSVG() {
      if (this.svg) {
        this.viewBox.x = 0
        this.viewBox.y = 0
      }
    },
    fitSVGToExtent() {
      const { minX, minY, maxX, maxY } = this.calculateBoundingBox(this.lines, this.blocks, this.rectangles, this.paths, this.texts)

      if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
        console.error('No elements to fit')
        return
      }

      const width = maxX - minX
      const height = maxY - minY

      // Add some padding
      const padding = 20
      const viewBoxWidth = width + 2 * padding
      const viewBoxHeight = height + 2 * padding

      const containerWidth = this.svg.clientWidth
      const containerHeight = this.svg.clientHeight

      // Calculate the aspect ratios
      const contentAspectRatio = viewBoxWidth / viewBoxHeight
      const containerAspectRatio = containerWidth / containerHeight

      // Determine the final width and height to maintain the aspect ratio
      let finalWidth, finalHeight

      if (contentAspectRatio > containerAspectRatio) {
        finalWidth = viewBoxWidth
        finalHeight = viewBoxWidth / containerAspectRatio
      } else {
        finalHeight = viewBoxHeight
        finalWidth = viewBoxHeight * containerAspectRatio
      }

      // Calculate the offset to center the content
      const offsetX = (finalWidth - viewBoxWidth) / 2
      const offsetY = (finalHeight - viewBoxHeight) / 2

      // Save the old viewBox dimensions to calculate the zoom level
      const oldViewBoxWidth = this.viewBox.width
      const oldViewBoxHeight = this.viewBox.height

      // Set the viewBox to the calculated dimensions and center it
      this.viewBox.x = minX - padding - offsetX
      this.viewBox.y = minY - padding - offsetY
      this.viewBox.width = finalWidth
      this.viewBox.height = finalHeight

      // Calculate the new zoom level based on the ratio of the old viewBox dimensions to the new ones
      const scaleX = oldViewBoxWidth / finalWidth
      const scaleY = oldViewBoxHeight / finalHeight
      this.zoomLevel = Math.min(scaleX, scaleY) * this.zoomLevel // Adjust the zoom level accordingly

    },
    toggleGrid() {
      this.showGrid = !this.showGrid
    },
    getSelectedObject() {
      return this.selectedObject
      // if (this.selectedBlock) {
      //   return this.selectedBlock;
      // }
      // if (this.selectedLine) {
      //   return this.selectedLine;
      // }
      // if (this.selectedText) {
      //   return this.selectedText;
      // }
      // if (this.selectedRectangle) {
      //   return this.selectedRectangle;
      // }
      // if (this.selectedConnectionPoint) {
      //   return this.selectedConnectionPoint;
      // }
    },
    deselectAll() {
      this.selectText(null)
      this.selectBlock(null)
      this.selectLine(null)
      this.selectRectangle(null)
      this.selectConnectionPoint(null)
    },
    downloadSVG() {
      if (!this.svg) return

      // Serialize the SVG content
      const svgContent = this.getCleanedSVGMarkup()

      // Create a Blob with SVG content
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      // Create a downloadable link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = 'drawing.svg'
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    getSVGMarkup() {
      if (!this.svg) return ''
      return new XMLSerializer().serializeToString(this.svg)
    },
    getCleanedSVGMarkup() {
      if (!this.svg) return ''

      // Clone the SVG element
      const clonedSvgElement = this.svg.cloneNode(true)

      // Remove any other elements you don't want
      // For example, if you have an element with a specific class or ID
      const backgroundElement = clonedSvgElement.querySelector('.grid-container')
      if (backgroundElement) {
        backgroundElement.parentNode.removeChild(backgroundElement)
      }

      // Serialize the modified SVG
      return new XMLSerializer().serializeToString(clonedSvgElement)
    },
    downloadPDF() {
      const svgMarkup = this.getCleanedSVGMarkup()

      // Define the PDF document with SVG content and the conductor schedule table
      const docDefinition = {
        content: [
          { text: 'SVG to PDF Example', style: 'header' },
          {
            svg: svgMarkup,
            width: 500, // Adjust the width or use 'fit' to control size
          },
          { text: 'Conductor Schedule', style: 'sectionHeader', margin: [0, 10, 0, 5] },
          this.createConductorScheduleTable(),
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10],
          },
          sectionHeader: {
            fontSize: 12,
            bold: true,
            color: '#2a8899',
            margin: [0, 8, 0, 5],
          },
          tableHeader: {
            bold: true,
            fillColor: '#eefaff',
            alignment: 'left',
            fontSize: 10,
          },
          tableCell: {
            margin: [0, 2, 0, 2],
            fontSize: 9,
          },
          tableExample: {
            margin: [0, 5, 0, 15],
          },
        },
        defaultStyle: {
          fontSize: 10,
        },
        pageMargins: [20, 20, 20, 20],
      }
      // Download the PDF
      pdfMake.createPdf(docDefinition, null, pdfFonts).download('drawing.pdf')
    },
    createConductorScheduleTable() {
      // Build table body
      const body = []

      // Add header row using conductorTableHeadings
      const headerRow = this.conductorTableHeadings.map((heading) => ({
        text: heading.title.toUpperCase(),
        style: 'tableHeader',
      }))
      body.push(headerRow)
      // Add data rows
      if (this.lines.length > 0) {
        this.lines.forEach((line) => {
          const dataRow = this.conductorTableHeadings.map((heading) => {
            return {
              text:
                line[heading.key] !== undefined && line[heading.key] !== null
                  ? String(line[heading.key])
                  : 'N/A',
              style: 'tableCell',
            }
          })
          body.push(dataRow)
        })
      } else {
        // No lines, add a row indicating empty data
        const emptyRow = this.conductorTableHeadings.map(() => ({
          text: 'N/A',
          style: 'tableCell',
        }))
        body.push(emptyRow)
      }

      // Set column widths to distribute evenly
      const columnWidths = this.conductorTableHeadings.map(() => '*')

      return {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: columnWidths,
          body: body,
        },
        layout: 'lightHorizontalLines', // Optional: Add horizontal lines between rows
      }
    },
    calculateBoundingBox(lines, blocks, rectangles, paths, texts) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity

      const parser = new DOMParser()

      let elements = []
      if (blocks && blocks.length) {
        blocks.forEach((block) => {
          if (block.content) {
            const svgDoc = parser.parseFromString(block.content, 'image/svg+xml')
            const svgElement = svgDoc.documentElement

            // Get the viewBox of the SVG element
            const viewBox = svgElement?.viewBox?.baseVal

            // Convert width and height attributes to pixels if they exist
            let widthAttr = svgElement.getAttribute('width')
            let heightAttr = svgElement.getAttribute('height')
            const width = widthAttr ? this.convertToPixels(widthAttr) : (viewBox?.width || 40)
            const height = heightAttr ? this.convertToPixels(heightAttr) : (viewBox?.height || 40)

            const blockBox = {
              x: block.x + viewBox.x,
              y: block.y + viewBox.y,
              width: width,
              height: height,
            }

            if (blockBox.x < minX) minX = blockBox.x
            if (blockBox.y < minY) minY = blockBox.y
            if (blockBox.x + blockBox.width > maxX) maxX = blockBox.x + blockBox.width
            if (blockBox.y + blockBox.height > maxY) maxY = blockBox.y + blockBox.height
          }

          const blockElements = []

          let drawing = block.elements

          for (const { prop, type } of this.elementTypes) {
            // Check if block.elements exists and has the property
            if (drawing && Array.isArray(drawing[prop])) {
              const items = drawing[prop]
              elements.push(
                ...items.map((item) => ({
                  ...item,
                  type,
                }))
              )
            }
          }


          elements.push(...blockElements)
        })
      }

      lines.push(...elements.filter((el) => el.type === 'line'))
      rectangles.push(...elements.filter((el) => el.type === 'rectangle'))
      texts.push(...elements.filter((el) => el.type === 'text'))
      paths.push(...elements.filter((el) => el.type === 'path'))

      lines?.forEach((line) => {
        line?.points?.forEach((point) => {
          if (point.x < minX) minX = point.x
          if (point.y < minY) minY = point.y
          if (point.x > maxX) maxX = point.x
          if (point.y > maxY) maxY = point.y
        })
      })

      rectangles?.forEach((rectangle) => {
        if (rectangle.x < minX) minX = rectangle.x
        if (rectangle.y < minY) minY = rectangle.y
        if (rectangle.x + rectangle.width > maxX) maxX = rectangle.x + rectangle.width
        if (rectangle.y + rectangle.height > maxY) maxY = rectangle.y + rectangle.height
      })

      paths?.forEach((path) => {
        const pathBox = calculatePathBoundingBox(path.d)
        if (pathBox.minX < minX) minX = pathBox.minX
        if (pathBox.minY < minY) minY = pathBox.minY
        if (pathBox.maxX > maxX) maxX = pathBox.maxX
        if (pathBox.maxY > maxY) maxY = pathBox.maxY
      })

      texts?.forEach((text) => {
        const textBox = calculateTextBoundingBox(text)
        if (textBox.minX < minX) minX = textBox.minX
        if (textBox.minY < minY) minY = textBox.minY
        if (textBox.maxX > maxX) maxX = textBox.maxX
        if (textBox.maxY > maxY) maxY = textBox.maxY
      })

      return { minX, minY, maxX, maxY }
    }
  },

})



const calculatePathBoundingBox = (d) => {
  const path = new Path2D(d)
  const pathBoundingBox = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  }

  let currentPoint = { x: 0, y: 0 }
  let startX = 0
  let startY = 0

  const commands = d.match(/[a-df-z][^a-df-z]*/gi)
  commands.forEach((command) => {
    const type = command[0]
    const args = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number)

    switch (type) {
      case 'M':
        currentPoint = { x: args[0], y: args[1] }
        startX = currentPoint.x
        startY = currentPoint.y
        updateBoundingBox(pathBoundingBox, currentPoint)
        break
      case 'L':
        currentPoint = { x: args[0], y: args[1] }
        updateBoundingBox(pathBoundingBox, currentPoint)
        break
      case 'H':
        currentPoint.x = args[0]
        updateBoundingBox(pathBoundingBox, currentPoint)
        break
      case 'V':
        currentPoint.y = args[0]
        updateBoundingBox(pathBoundingBox, currentPoint)
        break
      case 'C':
        for (let i = 0; i < args.length; i += 6) {
          const cp1 = { x: args[i], y: args[i + 1] }
          const cp2 = { x: args[i + 2], y: args[i + 3] }
          const end = { x: args[i + 4], y: args[i + 5] }
          updateBoundingBox(pathBoundingBox, cp1, cp2, end)
          currentPoint = end
        }
        break
      case 'S':
      case 'Q':
        for (let i = 0; i < args.length; i += 4) {
          const cp = { x: args[i], y: args[i + 1] }
          const end = { x: args[i + 2], y: args[i + 3] }
          updateBoundingBox(pathBoundingBox, cp, end)
          currentPoint = end
        }
        break
      case 'T':
      case 'A':
        for (let i = 0; i < args.length; i += 2) {
          const end = { x: args[i], y: args[i + 1] }
          updateBoundingBox(pathBoundingBox, end)
          currentPoint = end
        }
        break
      case 'Z':
        currentPoint = { x: startX, y: startY }
        updateBoundingBox(pathBoundingBox, currentPoint)
        break
      default:
        break
    }
  })

  return pathBoundingBox
}

const updateBoundingBox = (boundingBox, ...points) => {
  points.forEach((point) => {
    if (point.x < boundingBox.minX) boundingBox.minX = point.x
    if (point.y < boundingBox.minY) boundingBox.minY = point.y
    if (point.x > boundingBox.maxX) boundingBox.maxX = point.x
    if (point.y > boundingBox.maxY) boundingBox.maxY = point.y
  })
}

// const calculatePathBoundingBox = (d) => {
//   const path = new Path2D(d);
//   const canvas = document.createElement('canvas');
//   const context = canvas.getContext('2d');
//   context.stroke(path);
//   const metrics = context.measureText(path);
//   return {
//     minX: metrics.actualBoundingBoxLeft,
//     minY: metrics.actualBoundingBoxAscent,
//     maxX: metrics.actualBoundingBoxRight,
//     maxY: metrics.actualBoundingBoxDescent
//   };
// };


const calculateTextBoundingBox = (text) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  textElement.setAttribute('x', text.x)
  textElement.setAttribute('y', text.y)
  textElement.setAttribute('font-size', text.fontSize)
  textElement.textContent = text.content
  svg.appendChild(textElement)
  document.body.appendChild(svg) // Append to DOM to getBBox to work

  const bbox = textElement.getBBox()
  document.body.removeChild(svg) // Remove from DOM after getting bbox

  return {
    minX: bbox.x,
    minY: bbox.y,
    maxX: bbox.x + bbox.width,
    maxY: bbox.y + bbox.height
  }
}

function decodeDataUri(dataUri) {
  // Remove the "data:image/svg+xml;charset=utf-8," part
  const svgContent = dataUri.replace(/^data:image\/svg\+xml;charset=utf-8,/, '')
  // Decode the URI-encoded SVG content
  const decodedContent = decodeURIComponent(svgContent)
  return decodedContent
}

function parseSvgContent(svgContent) {
  const parser = new DOMParser()
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml')
  const svgElements = svgDoc.querySelector('svg')
  return svgElements
}

function extractElementsFromSvg(svgElement) {
  const elements = []

  svgElement.querySelectorAll('rect').forEach((rect) => {
    elements.push({
      type: 'rectangle',
      x: parseFloat(rect.getAttribute('x')),
      y: parseFloat(rect.getAttribute('y')),
      width: parseFloat(rect.getAttribute('width')),
      height: parseFloat(rect.getAttribute('height')),
      color: rect.getAttribute('fill'),
      stroke: rect.getAttribute('stroke'),
      strokeWidth: parseFloat(rect.getAttribute('stroke-width'))
    })
  })

  svgElement.querySelectorAll('text').forEach((text) => {
    elements.push({
      type: 'text',
      x: parseFloat(text.getAttribute('x')),
      y: parseFloat(text.getAttribute('y')),
      fontSize: parseFloat(text.getAttribute('font-size')),
      content: text.textContent
    })
  })

  svgElement.querySelectorAll('line').forEach((line) => {
    elements.push({
      type: 'line',
      points: [
        { x: parseFloat(line.getAttribute('x1')), y: parseFloat(line.getAttribute('y1')) },
        { x: parseFloat(line.getAttribute('x2')), y: parseFloat(line.getAttribute('y2')) }
      ],
      color: line.getAttribute('stroke'),
      strokeDasharray: line.getAttribute('stroke-dasharray')
    })
  })

  svgElement.querySelectorAll('path').forEach((path) => {
    elements.push({
      type: 'path',
      d: path.getAttribute('d'),
      stroke: path.getAttribute('stroke'),
      strokeWidth: parseFloat(path.getAttribute('stroke-width')),
      fill: path.getAttribute('fill')
    })
  })

  return elements
}

function normalizePath(d, offsetX, offsetY) {
  // Split the path data into commands and coordinates
  const commands = d.match(/[a-z][^a-z]*/gi)
  if (!commands) return d

  // Function to normalize a coordinate pair
  const normalizeCoordinates = (coords, offsetX, offsetY) => {
    return coords.map((coord, index) => {
      if (index % 2 === 0) {
        // Even index: x-coordinate
        return parseFloat(coord) - offsetX
      } else {
        // Odd index: y-coordinate
        return parseFloat(coord) - offsetY
      }
    })
  }

  // Process each command
  const normalizedCommands = commands.map((command) => {
    const type = command[0]
    const args = command
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)
    let normalizedArgs

    switch (type.toLowerCase()) {
      case 'm': // moveto
      case 'l': // lineto
      case 't': // smooth curveto
        normalizedArgs = normalizeCoordinates(args, offsetX, offsetY)
        break
      case 'h': // horizontal lineto
        normalizedArgs = args.map((x) => x - offsetX)
        break
      case 'v': // vertical lineto
        normalizedArgs = args.map((y) => y - offsetY)
        break
      case 'c': // curveto
      case 's': // smooth curveto
      case 'q': // quadratic Bézier curve
      case 'a': // elliptical Arc
        normalizedArgs = normalizeCoordinates(args, offsetX, offsetY)
        break
      case 'z': // closepath
        normalizedArgs = []
        break
      default:
        normalizedArgs = args
        break
    }

    return type + normalizedArgs.join(' ')
  })

  // Join the normalized commands back into a single path data string
  return normalizedCommands.join(' ')
}
