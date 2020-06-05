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
import { SVG, Svg, List } from '@svgdotjs/svg.js';
import { zoom, zoomIdentity, select, event } from 'd3';
import '../lib/svg.draggable';
import '@vaadin/vaadin-license-checker/vaadin-license-checker';
import '@vaadin/vaadin-button';
import './vcf-svg-icons';

const SVG_NOT_READY = 'Svg not ready. Try using the `svg-ready` event.';

/**
 * `<vcf-svg>` is a Web component for manipulating and animating SVG graphics.
 *
 * This is a wrapper for [SVG.js](https://svgjs.com/docs/3.0).
 *
 * ```html
 * <vcf-svg></vcf-svg>
 * ```
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
        }

        :host([zoomable]:active) {
          cursor: grabbing;
        }

        :host(:not([zoomable])) #toolbar {
          display: none;
        }

        #toolbar {
          position: absolute;
          bottom: 0;
          display: flex;
          padding-right: var(--lumo-space-m);
          border-top-right-radius: var(--lumo-border-radius);
          user-select: none;
          transition: all 0.2s;
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
          transition: opacity 0.2s;
          white-space: nowrap;
        }

        #zoom span {
          margin: auto;
          margin-left: var(--lumo-space-m);
        }
      </style>
      <slot id="svgSlot" name="svg"></slot>
      <div id="toolbar" part="toolbar">
        <vaadin-button id="resetZoom" theme="tertiary icon" title="Reset Zoom">
          <iron-icon icon="vcf-svg:bullseye"></iron-icon>
        </vaadin-button>
        <div id="zoom" part="zoom">
          <span>[[panZoomInfo.scale]]</span>
          <span>[[panZoomInfo.x]]</span>
          <span>[[panZoomInfo.y]]</span>
        </div>
      </div>
    `;
  }

  static get is() {
    return 'vcf-svg';
  }

  static get version() {
    return '0.1.12';
  }

  static get properties() {
    return {
      /**
       * Main SVG document.
       *
       * Refer to [SVG.js Docs](https://svgjs.com/docs/3.0) for more info.
       * @type {Svg}
       */
      draw: Svg,

      /**
       * 1. [SVG() | Constructor](https://svgjs.com/docs/3.0/container-elements/#svg-constructor)
       * 1. [SVG() | Find](https://svgjs.com/docs/3.0/referencing-creating-elements/#svg)
       * @type {SVG}
       */
      SVG: {
        type: Object,
        value: () => SVG
      },

      /**
       * Enable pan and zoom functionality.
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
      panZoomInfo: {
        type: Object,
        value: () => ({ scale: '100%', x: '0', y: '0' })
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

      _updateCache: {
        type: Array,
        value: () => []
      }
    };
  }

  static get observers() {
    return ['_zoomableChanged(zoomable, draw)', '_transformChanged(_transform, _transform.*)', '_dimensionsChanged(width, height)'];
  }

  /**
   * @returns {List}
   */
  get children() {
    return this.draw.children();
  }

  ready() {
    super.ready();
    this.$.resetZoom.addEventListener('click', () => this.resetZoom());
    this.$.svgSlot.addEventListener('slotchange', () => this._onSvgSlotChange());
    if (!this.$.svgSlot.assignedNodes().length) {
      this.SVG()
        .addTo(this)
        .attr({ slot: 'svg' });
    }
  }

  add(attributes, parentElementId) {
    this._drawSafe(() => {
      const parentElement = this._getParentElement(parentElementId);
      this._createElement(attributes, parentElement);
    });
  }

  update(attributes) {
    this._drawSafe(() => {
      const element = this.findOneById(attributes.id);
      this._executeServerUpdates(element, attributes);
    });
  }

  find(selector, parentElementId) {
    if (!this.draw) throw new Error(SVG_NOT_READY);
    else {
      const parentElement = this._getParentElement(parentElementId);
      return parentElement.find(selector);
    }
  }

  findOne(selector, parentElementId) {
    if (!this.draw) throw new Error(SVG_NOT_READY);
    else {
      const parentElement = this._getParentElement(parentElementId);
      const element = parentElement.findOne(selector);
      if (element) return element;
      else throw new Error(`Element with selector "${selector}" not found.`);
    }
  }

  findOneById(id) {
    return this.findOne(`[id="${id}"]`);
  }

  viewbox(...args) {
    if (this._svg) this._svg.viewbox(...args);
    return this.draw;
  }

  size(...args) {
    if (this._svg) this._svg.size(...args);
    return this.draw;
  }

  resetZoom(duration = 1000) {
    select(this._svg.node)
      .transition()
      .duration(duration)
      .call(this._zoom.transform, zoomIdentity);
  }

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

  draggable(element, draggable) {
    const dragEvents = ['beforedrag', 'dragstart', 'dragmove', 'dragend'];
    element.draggable(draggable);
    if (draggable) {
      element.addClass('draggable');
      this._addElementEvents(element, dragEvents);
    } else {
      element.removeClass('draggable');
      this._removeElementEvents(element, dragEvents);
    }
  }

  _addElementEvents(element, events) {
    events.forEach(eventName => {
      element.listeners = element.listeners || {};
      element.listeners[eventName] = e => this.dispatchEvent(new CustomEvent(eventName, { detail: e.detail }));
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

  _removePrivateAttributes(attributes) {
    Object.keys(attributes).forEach(key => key.includes('__') && delete attributes[key]);
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

  _setPanZoomEvents(zoomable) {
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

  _onSvgSlotChange() {
    const slotted = this.$.svgSlot.assignedNodes().filter(node => node.tagName.toLowerCase() === 'svg');
    if (slotted.length) {
      this._svg = this.SVG(slotted[0]).attr({});
      this.set('draw', this._svg);
      this._executeUpdates();
      this.dispatchEvent(new CustomEvent('svg-ready'), { detail: this.draw });
    }
  }

  _drawSafe(callback) {
    if (!this.draw) this._updateCache.push(callback);
    else callback();
  }

  _executeUpdates() {
    while (this._updateCache.length) this._updateCache.shift()();
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
      this.draggable(element, Boolean(element.attr('draggable')));
    }
  }

  _zoomableChanged(zoomable, draw) {
    if (draw && this._svg) {
      this._setZoomContainer(zoomable);
      this._setPanZoomEvents(zoomable);
    }
  }

  _transformChanged(transform) {
    this.$.toolbar.classList.add('zooming');
    this.panZoomInfo = {
      scale: `${Math.floor(transform.k * 100)}%`,
      x: `x: ${Math.floor(transform.x)}`,
      y: `y: ${Math.floor(transform.y)}`
    };
    this.__debounce(() => this.$.toolbar.classList.remove('zooming'), 2000);
  }

  _dimensionsChanged(width, height) {
    if (width) this._svg.css({ width });
    if (height) this._svg.css({ height });
  }

  __debounce(fn, duration) {
    const id = `${fn}`.replace(/\s/g, '');
    let timeout = this.__getTimeout(id);
    if (!timeout) {
      timeout = { id };
      this.__timeouts.push(timeout);
    }
    clearTimeout(timeout.value);
    timeout.value = setTimeout(fn, duration);
  }

  __getTimeout(id) {
    this.__timeouts = this.__timeouts || [];
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
   * Fired when the methods for the SVG in the `svg` slot can be used.
   *
   * @event svg-ready
   */
}

export * from '@svgdotjs/svg.js';

customElements.define(VcfSvg.is, VcfSvg);

/**
 * @namespace Vaadin
 */
window.Vaadin.VcfSvg = VcfSvg;
