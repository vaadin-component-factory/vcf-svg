/* eslint-disable max-len */

/**
 * @license
 * Copyright (C) 2015 Vaadin Ltd.
 * This program is available under Commercial Vaadin Add-On License 3.0 (CVALv3).
 * See the file LICENSE.md distributed with this software for more information about licensing.
 * See [the website]{@link https://vaadin.com/license/cval-3} for the complete license.
 */

import { html, PolymerElement } from '@polymer/polymer/polymer-element';
import { ThemableMixin } from '@vaadin/vaadin-themable-mixin';
import { ElementMixin } from '@vaadin/vaadin-element-mixin';
// eslint-disable-next-line no-unused-vars
import { SVG, Svg, List, Element, Shape } from '@svgdotjs/svg.js';
import { zoom, zoomIdentity, select, event } from 'd3';
import '../lib/svg.draggable';
import '@vaadin/vaadin-license-checker/vaadin-license-checker';
import '@vaadin/vaadin-button';
import './vcf-svg-icons';

const SVG_NOT_READY = 'Svg not ready. Try using the `svg-ready` event.';
const EVENT_ATTR_PREFIX = 'on-';

/**
 * `<vcf-svg>` is a Web component for manipulating and animating SVG graphics.
 *
 * - Web Component wrapper for the JS library [SVG.js](https://svgjs.com/docs/3.0).
 * - Zoom and pan functionality implemented with [d3-zoom](https://github.com/d3/d3-zoom).
 * - Draggable functionality implemented with plugin [svg.draggable.js](https://github.com/svgdotjs/svg.draggable.js).
 *
 * ```html
 * <vcf-svg zoomable>
 *  <svg viewbox="0 0 400 200">
 *    <rect x="0" y="0" width="100" height="100" draggable="true"></rect>
 *  </svg>
 * </vcf-svg>
 * ```
 *
 * ### Slots
 *
 * Slot name | Content description | Default
 * --|--|--
 * _no-slot_ | `<svg>` element to be used or any container element to insert default `<svg>` into. Only first element is used. | `<svg></svg>`
 * _svg_ | `<svg>` element to be used or any container element to insert default `<svg>` into. Only first element is used. | `<svg></svg>`
 *
 * > __NOTE:__ If slotted element not an `<svg>`, [`SVG()`](https://svgjs.com/docs/3.0/container-elements/#svg-constructor) used to add default.
 *
 * ### Styling
 *
 * The following Shadow DOM parts are available for styling the overlay component itself:
 *
 * Part name  | Description
 * --|--
 * `toolbar` | Toolbar container.
 * `reset-zoom-button` | Reset zoom button.
 * `zoom-display` | Zoom information container.
 *
 * The following custom properties are available for styling:
 *
 * Custom property | Description | Default
 * --|--|--
 * `--vcf-svg-toolbar-display` | `display` property for `toolbar` part. | `flex`
 * `--vcf-svg-toolbar-top` | `top` property for `toolbar` part. | `unset`
 * `--vcf-svg-toolbar-right` | `right` property for `toolbar` part. | `unset`
 * `--vcf-svg-toolbar-bottom` | `bottom` property for `toolbar` part. | `0`
 * `--vcf-svg-toolbar-left` | `left` property for `toolbar` part. | `unset`
 * `--vcf-svg-toolbar-border-radius` | `border-radius` property for `toolbar` part. | `0 var(--lumo-border-radius) 0 0`
 *
 * See [ThemableMixin – how to apply styles for shadow parts](https://github.com/vaadin/vaadin-themable-mixin/wiki)
 *
 * @memberof Vaadin
 * @mixes ElementMixin
 * @mixes ThemableMixin
 * @demo demo/index.html
 */
class VcfSvg extends ElementMixin(ThemableMixin(PolymerElement)) {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          position: relative;
          overflow: hidden;
          --vcf-svg-toolbar-display: flex;
          --vcf-svg-toolbar-top: unset;
          --vcf-svg-toolbar-right: unset;
          --vcf-svg-toolbar-bottom: 0;
          --vcf-svg-toolbar-left: unset;
          --vcf-svg-toolbar-border-radius: 0 var(--lumo-border-radius) 0 0;
        }

        :host([zoomable]:active) {
          cursor: grabbing;
        }

        :host(:not([zoomable])) #toolbar {
          display: none;
        }

        ::slotted(svg) {
          width: 100%;
          height: 100%;
        }

        #toolbar {
          position: absolute;
          user-select: none;
          transition: all 0.2s;
          display: var(--vcf-svg-toolbar-display);
          top: var(--vcf-svg-toolbar-top);
          right: var(--vcf-svg-toolbar-right);
          bottom: var(--vcf-svg-toolbar-bottom);
          left: var(--vcf-svg-toolbar-left);
          border-radius: 0 var(--lumo-border-radius) 0 0;
        }

        #toolbar.zooming {
          background-color: var(--lumo-tint-10pct);
        }

        #toolbar.zooming #zoom {
          opacity: 0.6;
        }

        #resetZoom {
          color: var(--lumo-secondary-text-color);
          font-size: var(--lumo-font-size-s);
        }

        #zoom {
          font-family: monospace;
          display: flex;
          font-weight: bold;
          font-size: var(--lumo-font-size-m);
          opacity: 0;
          margin-top: 2px;
          padding-right: var(--lumo-space-m);
          transition: opacity 0.2s;
          white-space: nowrap;
        }

        #zoom span {
          margin: auto;
          margin-left: var(--lumo-space-m);
        }
      </style>
      <slot id="slot" on-slotchange="_onSvgSlotChange"></slot>
      <slot id="svgSlot" name="svg" on-slotchange="_onSvgSlotChange"></slot>
      <div id="toolbar" part="toolbar">
        <vaadin-button id="resetZoom" theme="tertiary icon" title="Reset Zoom" part="reset-zoom-button">
          <iron-icon icon="vcf-svg:bullseye"></iron-icon>
        </vaadin-button>
        <div id="zoom" part="zoom-display">
          <span>[[zoom.scale]]</span>
          <span>[[zoom.x]]</span>
          <span>[[zoom.y]]</span>
        </div>
      </div>
    `;
  }

  static get is() {
    return 'vcf-svg';
  }

  static get version() {
    return '1.0.4';
  }

  static get properties() {
    return {
      /**
       * Main [Svg](https://svgjs.com/docs/3.0/container-elements/#svg-svg) element.
       *
       * Returns `<svg>` (or `<g part="zoomContainer">` if `zoomable` is enabled).
       *
       * @type {Svg}
       */
      draw: Svg,

      /**
       * 1. SVG() [Constructor](https://svgjs.com/docs/3.0/container-elements/#svg-constructor)
       * 1. SVG() [Find](https://svgjs.com/docs/3.0/referencing-creating-elements/#svg)
       * @type {SVG}
       */
      SVG: {
        type: Object,
        value: () => SVG
      },

      /**
       * Enable zoom and pan functionality.
       * @type {Boolean}
       */
      zoomable: {
        type: Boolean,
        reflectToAttribute: true,
        value: false
      },

      /**
       * Current zoom and pan information.
       * @type {Object}
       */
      zoom: {
        type: Object,
        computed: '_getZoom(_transform)'
      },

      /**
       * Width of SVG.
       * @type {String}
       */
      width: String,

      /**
       * Height of SVG.
       * @type {String}
       */
      height: String,

      /**
       * @protected
       * Queue of updates to run after the `svg-ready` event.
       */
      _updates: {
        type: Array,
        value: () => []
      },

      /**
       * @private
       * Array of objects with props:
       * - 'id': Id generated for the `__debounce` callback function.
       * - `timeoutId`: Id returned by `setTimeout`.
       * Used by `__debounce` for cancelling previous timeouts.
       */
      __timeouts: {
        type: Array,
        value: () => []
      }
    };
  }

  static get observers() {
    return ['_zoomableChanged(zoomable, draw)', '_transformChanged(_transform, _transform.*)', '_dimensionsChanged(width, height)'];
  }

  /**
   * Returns [SVG.List](https://svgjs.com/docs/3.0/classes/#svg-list) of child elements.
   * @returns {List}
   */
  get children() {
    return this.draw.children();
  }

  ready() {
    super.ready();
    this.$.resetZoom.addEventListener('click', () => this.resetZoom());
    if (!this.$.svgSlot.assignedNodes().length && !this.$.slot.assignedNodes().length) {
      this.SVG()
        .attr({ slot: 'svg' })
        .addTo(this);
    }
  }

  /**
   * Add element to the svg.
   * If `parentElementId` is specified, it will be added to the element with that id.
   *
   * An `attributes` object may be used instead of element:
   * - `attributes` __Object__
   * - `attributes.__constructor` __String__ Element constructor (e.g. Rect)
   * - `attributes.__constructorArgs` __Array<Any>__ Array of constructor args
   *   - Example: `Rect = [100, 100] = [width, height]`
   * - `attributes.__updates` __Array<Object>__ Array of "updates" to be applied after element creation
   *   - Example: `[ {"function": "move", "args": [100, 100]} ]`
   * - `attributes.__elements` __Array<String>__ Array of Ids of other elements to be added to this element
   *   - Example: `["circle1", "rect1"]`
   *
   * _Used by the [Java API](https://github.com/vaadin-component-factory/svg)._
   *
   * @param {Object} element [Shape](https://svgjs.com/docs/3.0/shape-elements/) `element` or `attributes` object (described above).
   * @param {String} parentElementId Id of element to add this element to.
   */
  add(element, parentElementId) {
    this._afterSvgReady(() => {
      const parentElement = this._getParentElement(parentElementId);
      if (element instanceof Shape) parentElement.add(element);
      else this._createElement(element, parentElement);
    });
  }

  /**
   * Update attributes of an element in the SVG.
   * - `attributes` __Object__
   * - `attributes.__constructor` __String__ Element constructor (e.g. Rect)
   * - `attributes.__constructorArgs` __Array<Any>__ Array of constructor args
   *   - Example: `Rect = [100, 100] = [width, height]`
   * - `attributes.__updates` __Array<Object>__ Array of "updates" to be applied after element creation
   *   - Example: `[ {"function": "move", "args": [100, 100]} ]`
   * - `attributes.__elements` __Array<String>__ Array of Ids of other elements to be added to this element
   *   - Example: `["circle1", "rect1"]`
   *
   * _Used by the [Java API](https://github.com/vaadin-component-factory/svg)._
   *
   * @param {Object} attributes `attributes` object (described above).
   * @param {Object} selector CSS selector for element to update.
   */
  update(attributes, selector) {
    this._afterSvgReady(() => {
      const element = this.findOne(selector || `[id="${attributes.id}"]`);
      this._executeServerUpdates(element, attributes);
    });
  }

  /**
   * Remove element with `elementId` from the SVG.
   *
   * @param {String} elementId
   */
  remove(elementId) {
    this._afterSvgReady(() => {
      const element = this.findOneById(elementId);
      element.remove();
    });
  }

  /**
   * Find elements matching `selector`.
   * If `parentElementId` is specified, will search inside the element with that id.
   *
   * Returns [SVG.List](https://svgjs.com/docs/3.0/classes/#svg-list)
   *
   * @param {String} selector CSS selector
   * @param {String} parentElementId Id of parent element
   * @returns {List}
   */
  find(selector, parentElementId) {
    if (!this.draw) throw new Error(SVG_NOT_READY);
    else {
      const parentElement = this._getParentElement(parentElementId);
      return parentElement.find(selector);
    }
  }

  /**
   * Find first element matching `selector`.
   * If `parentElementId` is specified, will search inside the element with that id.
   *
   * @param {String} selector CSS selector
   * @param {String} parentElementId Id of parent element
   * @returns {Element}
   */
  findOne(selector, parentElementId) {
    if (!this.draw) throw new Error(SVG_NOT_READY);
    else {
      const parentElement = this._getParentElement(parentElementId);
      const element = parentElement.findOne(selector);
      if (element) return element;
      else throw new Error(`Element with selector "${selector}" not found.`);
    }
  }

  /**
   * Find first element matching `id`.
   *
   * @param {String} id Element id.
   * @returns {Element}
   */
  findOneById(id) {
    return this.findOne(`[id="${id}"]`);
  }

  /**
   * Set [viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox) of `<svg>`.
   * Defines the position and dimension of the SVG viewport.
   *
   * @param {Number} minx Min x value.
   * @param {Number} miny Min y value.
   * @param {Number} width Width.
   * @param {Number} height Height.
   */
  viewbox(...args) {
    this._afterSvgReady(() => this._svg && this._svg.viewbox(...args));
  }

  /**
   * Set SVG size.
   *
   * @param {Number} width Width.
   * @param {Number} height Height.
   */
  size(...args) {
    this._afterSvgReady(() => this._svg && this._svg.size(...args));
  }

  /**
   * Reset zoom scale and pan to initial values (scale: 100%, x: 0, y: 0).
   *
   * @param {Number} duration Transition duration.
   */
  resetZoom(duration = 1000) {
    select(this._svg.node)
      .transition()
      .duration(duration)
      .call(this._zoom.transform, zoomIdentity);
  }

  /**
   * Pan to first element matching `selector`.
   * If `scale = true` will also zoom to fit element in viewport.
   *
   * @param {String} selector CSS selector.
   * @param {Boolean} scale Set `false` to disable fit element in viewport.
   * @param {Number} duration Transition duration.
   */
  panTo(selector, scale = true, duration = 1000) {
    const d3Svg = select(this._svg.node);
    const element = this.zoomContainer.findOne(selector);
    if (element) {
      const viewbox = this._svg.viewbox();
      const bounds = element.node.getBBox();
      const padding = 40;
      const widthRatio = viewbox.width / (bounds.width + padding * 2);
      const heightRatio = viewbox.height / (bounds.height + padding * 2);
      const size = (heightRatio < widthRatio ? heightRatio : widthRatio) / this._transform.k;
      const coords = this._convertCoords(element.node);
      const transformX = -(coords.x - this._transform.x) * size + padding;
      const transformY = -(coords.y - this._transform.y) * size + padding;
      const offsetTransformX = (transformX - this._transform.x) / this._transform.k;
      const offsetTransformY = (transformY - this._transform.y) / this._transform.k;
      let transform = this._transform.translate(offsetTransformX, offsetTransformY);
      if (scale) transform = transform.scale(size);
      d3Svg
        .transition()
        .duration(duration)
        .call(this._zoom.transform, transform);
    }
  }

  /**
   * Toggle draggable events for `element`.
   * If `scale = true` will also zoom to fit element in viewport.
   *
   * @param {Element} element Element (SVG.js wrapper).
   * @param {Boolean} draggable Toggle draggable events.
   */
  draggable(element, draggable) {
    const dragEvents = ['beforedrag', 'dragstart', 'dragmove', 'dragend'];
    if (draggable && !element.hasClass('draggable')) {
      element.draggable(true);
      element.addClass('draggable');
      this._addElementEvents(element, dragEvents, false);
    } else if (!draggable) {
      element.draggable(false);
      element.removeClass('draggable');
      this._removeElementEvents(element, dragEvents, false);
    }
  }

  /**
   * This will dispatch the supplied `element`'s `eventName` events from the main `vcf-svg` web component.
   *
   * - Dispatched events have "element-" prefix (e.g. `element-click`).
   * - Dispatched events have an `originalEvent` property to access the original event.
   *
   * @param {Element} element Element (SVG.js wrapper).
   * @param {String} eventName Event name.
   */
  on(element, eventName) {
    if (!Array.isArray(eventName)) eventName = [eventName];
    this._addElementEvents(element, eventName);
  }

  /**
   * Stop dispatiching `element`'s `eventName` events.
   *
   * @param {Element} element Element (SVG.js wrapper).
   * @param {String} eventName Event name.
   */
  off(element, eventName) {
    if (!Array.isArray(eventName)) eventName = [eventName];
    this._removeElementEvents(element, eventName);
  }

  _addElementEvents(element, events, prefix = true) {
    events.forEach(eventName => {
      const modifedEventName = prefix ? `element-${eventName}` : eventName;
      element.listeners = element.listeners || {};
      element.listeners[eventName] = e => {
        if (eventName === 'dragend' && Object.keys(element.listeners).includes('click')) {
          const bbox = e.detail.handler.el.bbox();
          const originalBbox = e.detail.handler.box;
          const dragged = bbox.x !== originalBbox.x && bbox.y !== originalBbox.y;
          if (!dragged) return;
          else element.dragged = true;
        }
        if (eventName === 'click' && element.dragged) {
          element.dragged = false;
          return;
        }
        const event = new CustomEvent(modifedEventName, { detail: e.detail, cancelable: e.cancelable });
        event.originalEvent = e;
        event.element = element;
        this.dispatchEvent(event);
      };
      element.node.addEventListener(eventName, element.listeners[eventName]);
    });
  }

  _removeElementEvents(element, events) {
    const listeners = element.listeners;
    if (listeners) {
      events = events || Object.keys(listeners);
      Object.keys(listeners).forEach(eventName => {
        if (events.includes(eventName)) {
          element.node.removeEventListener(eventName, element.listeners[eventName]);
          delete element.listeners[eventName];
        }
      });
    }
  }

  _createElement(attributes, parentElement) {
    if (attributes.__constructor) {
      const elementConstructor = parentElement[attributes.__constructor];
      if (elementConstructor) {
        const args = attributes.__constructorArgs || [];
        const element = elementConstructor.call(parentElement, ...args);
        this._executeServerUpdates(element, attributes);
        return element;
      } else {
        throw new Error(`\`${attributes.__constructor}\` constructor undefined.`);
      }
    } else {
      throw new Error('`__constructor` undefined.');
    }
  }

  _getParentElement(parentElementId) {
    let parentElement = this.draw;
    if (parentElementId) parentElement = this.findOneById(parentElementId);
    return parentElement;
  }

  _convertCoords(element) {
    const viewbox = this._svg.viewbox();
    const widthFactor = viewbox.width / this._svg.node.clientWidth;
    const heightFactor = viewbox.height / this._svg.node.clientHeight;
    const bounds = element.getBBox();
    const x = bounds.x;
    const y = bounds.y;
    const offset = this._svg.node.getBoundingClientRect();
    const matrix = element.getScreenCTM();
    return {
      x: (matrix.a * x + matrix.c * y + matrix.e - offset.left) * widthFactor,
      y: (matrix.b * x + matrix.d * y + matrix.f - offset.top) * heightFactor
    };
  }

  _setZoomEvents(zoomable) {
    const d3Svg = select(this._svg.node);
    if (zoomable) {
      const d3ZoomContainer = select(this.zoomContainer.node);
      this._transform = zoomIdentity;
      this._zoom = zoom()
        .scaleExtent([0.01, 5])
        .on('zoom', () => {
          this._transform = event.transform || zoomIdentity;
          d3ZoomContainer.attr('transform', this._transform);
        });
      d3Svg.call(this._zoom).call(this._zoom.transform, this._transform);
    } else {
      this._zoom = zoom().on('zoom', null);
      d3Svg
        .call(this._zoom, null)
        .on('mousedown.zoom', null)
        .on('mousemove.zoom', null)
        .on('dblclick.zoom', null)
        .on('touchstart.zoom', null)
        .on('wheel.zoom', null)
        .on('mousewheel.zoom', null)
        .on('MozMousePixelScroll.zoom', null);
    }
  }

  _setZoomContainer(zoomable) {
    if (zoomable && !this.zoomContainer) {
      const zoomContainer = this.draw.group().attr({ id: 'zoomContainer', part: 'zoomContainer' });
      this._svg.children().forEach(child => {
        if (child !== zoomContainer) zoomContainer.add(child);
      });
      this.zoomContainer = zoomContainer;
      this.set('draw', this.zoomContainer);
    } else if (!zoomable && this.zoomContainer) {
      this.zoomContainer.children().forEach(child => {
        if (child !== this.zoomContainer) this._svg.add(child);
      });
      this.zoomContainer.remove();
      this.zoomContainer = false;
      this.set('draw', this._svg);
    }
  }

  _onSvgSlotChange(e) {
    const slotted = e.target.assignedNodes().filter(node => node.nodeType === 1)[0];
    if (slotted) {
      this._svg = slotted.tagName.toLowerCase() === 'svg' ? this.SVG(slotted) : this.SVG().addTo(slotted);
      this.set('draw', this._svg);
      this._executeUpdates();
      this.dispatchEvent(new CustomEvent('svg-ready'), { detail: this.draw });
    }
  }

  _afterSvgReady(callback) {
    if (!this.draw) this._updates.push(callback);
    else callback();
  }

  _executeUpdates() {
    while (this._updates && this._updates.length) this._updates.shift()();
  }

  _executeServerUpdates(element, attributes) {
    if (element && attributes) {
      const updates = attributes.__updates;
      const elements = attributes.__elements;
      if (elements) {
        elements.forEach(id => {
          const el = this.findOneById(id);
          if (el) element.add(el);
        });
      }
      this._removePrivateAttributes(attributes);
      element.attr(attributes);
      while (updates.length) {
        const update = updates.shift();
        element[update.function](...update.args);
      }
      this._setEventListeners(element);
    }
  }

  _setEventListeners(element) {
    this.draggable(element, element.attr('draggable') === 'true');
    Object.keys(element.attr()).forEach(key => {
      if (key.includes(EVENT_ATTR_PREFIX)) {
        const eventName = key.replace(EVENT_ATTR_PREFIX, '');
        const listen = element.attr(key) === 'true';
        if (listen) this._addElementEvents(element, [eventName]);
        else this._removeElementEvents(element, [eventName]);
      }
    });
  }

  _removePrivateAttributes(attributes) {
    Object.keys(attributes).forEach(key => key.includes('__') && delete attributes[key]);
  }

  _getZoom(transform) {
    return {
      scale: `${Math.floor(transform.k * 100)}%`,
      x: `x: ${Math.floor(transform.x)}`,
      y: `y: ${Math.floor(transform.y)}`
    };
  }

  _zoomableChanged(zoomable, draw) {
    if (draw && this._svg) {
      this._setZoomContainer(zoomable);
      this._setZoomEvents(zoomable);
    }
  }

  _transformChanged() {
    this.$.toolbar.classList.add('zooming');
    this.__debounce(() => this.$.toolbar.classList.remove('zooming'), 2000);
  }

  _dimensionsChanged(width, height) {
    this._afterSvgReady(() => {
      if (width) this._svg.css({ width });
      if (height) this._svg.css({ height });
    });
  }

  __debounce(fn, duration) {
    const id = `${fn}`.replace(/\s/g, '');
    let timeout = this.__getTimeout(id);
    if (!timeout) {
      timeout = { id };
      this.__timeouts.push(timeout);
    }
    clearTimeout(timeout.timeoutId);
    timeout.timeoutId = setTimeout(fn, duration);
  }

  __getTimeout(id) {
    return this.__timeouts.filter(timeout => timeout && timeout.id === id)[0];
  }

  /**
   * @protected
   */
  static _finalizeClass() {
    super._finalizeClass();
    const devModeCallback = window.Vaadin.developmentModeCallback;
    const licenseChecker = devModeCallback && devModeCallback['vaadin-license-checker'];
    if (typeof licenseChecker === 'function') {
      licenseChecker(VcfSvg);
    }
  }

  /**
   * Fired when the methods for the `<svg>` in the `"svg"` slot can be used.
   * - `e.detail` __Object__ The `draw` property. Main [Svg](https://svgjs.com/docs/3.0/container-elements/#svg-svg) element.
   *
   * @event svg-ready
   */

  /**
   * Fired before `dragstart` (cancelable).
   * - `e.detail` __Object__
   * - `e.detail.event` __Event__ Original mouse/touch event.
   * - `e.detail.el` __Element__ Element reference (SVG.js wrapper).
   *
   * @event beforedrag
   *
   */

  /**
   * Fired before `dragmove`.
   * - `e.detail` __Object__
   * - `e.detail.event` __Event__ Original mouse/touch event.
   * - `e.detail.box` __Object__ New bbox of the element.
   * - `e.detail.el` __Element__ Element reference (SVG.js wrapper).
   *
   * @event dragstart
   */

  /**
   * Fired while dragging (cancelable).
   * - `e.detail` __Object__
   * - `e.detail.event` __Event__ Original mouse/touch event.
   * - `e.detail.box` __Object__ New bbox of the element.
   * - `e.detail.el` __Element__ Element reference (SVG.js wrapper).
   *
   * @event dragmove
   */

  /**
   * Fired after `dragmove`.
   * - `e.detail` __Object__
   * - `e.detail.event` __Event__ Original mouse/touch event.
   * - `e.detail.box` __Object__ New bbox of the element.
   * - `e.detail.el` __Element__ Element reference (SVG.js wrapper).
   *
   * @event dragend
   */

  /**
   * Bubbled up `eventName` from an element.
   * - `e.originalEvent` __Event__ The original `eventName` event.
   *
   * @event element-eventName
   */
}

export * from '@svgdotjs/svg.js';

customElements.define(VcfSvg.is, VcfSvg);

/**
 * @namespace Vaadin
 */
window.Vaadin.VcfSvg = VcfSvg;
