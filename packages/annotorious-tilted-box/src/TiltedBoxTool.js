import EventEmitter from 'tiny-emitter';
import RubberbandTiltedBox from './RubberbandTiltedBox';

import './TiltedBoxTool.scss';

// Event Emitter could go into a base class
export default class TiltedBoxTool extends EventEmitter {

  constructor(g, config, env) {
    super();
    
    // This could be moved into a base class
    this.svg = g.closest('svg');

    this.g = g;
    this.config = config;
    this.env = env;

    this.isDrawing = false;
  }

  /**
   * This could be moved into a base class
   */
  _attachListeners = () => {
    this.svg.addEventListener('mousemove', this.onMouseMove);    
    document.addEventListener('mouseup', this.onMouseUp);
  }

  /**
   * This could be moved into a base class
   */
  _detachListeners = () => {
    this.svg.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  /**
   * This could be moved into a base class
   */
  _toSVG = (x, y) => {
    const pt = this.svg.createSVGPoint();

    const { left, top } = this.svg.getBoundingClientRect();
    pt.x = x + left;
    pt.y = y + top;

    return pt.matrixTransform(this.g.getScreenCTM().inverse());
  }   

  startDrawing = evt => {
    if (!this.isDrawing) {
      this.isDrawing = true;

      const { x, y } = this._toSVG(evt.layerX, evt.layerY);
      this._attachListeners();
      this.rubberband = new RubberbandTiltedBox(x, y, this.g, this.env);
    }
  }

  stop = () => {
    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }

  onMouseMove = evt => {
    const { x , y } = this._toSVG(evt.layerX, evt.layerY);
    this.rubberband.onMouseMove(x, y);
  }
  
  onMouseUp = evt => {
    if (this.rubberband.isCollapsed) {
      this.emit('cancel', evt);
      this.stop();
    } else if (this.rubberband.isComplete) {
      this.rubberband.destroy();
    } else {
      const { x , y } = this._toSVG(evt.layerX, evt.layerY);
      this.rubberband.onMouseUp([ x, y ]);
    }
  }

  createEditableShape = annotation =>
    new EditableRect(annotation, this.g, this.config, this.env);

  get supportsModify() {
    return true;
  }

}