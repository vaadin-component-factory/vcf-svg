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
import { SVG, Svg } from '@svgdotjs/svg.js';
import { zoom, zoomIdentity, select, event } from 'd3';
import '@vaadin/vaadin-license-checker/vaadin-license-checker';
import '@vaadin/vaadin-button';
import './vcf-svg-icons';

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
        }

        :host([zoomable]:active) {
          cursor: grabbing;
        }

        :host(:not([zoomable])) [part='toolbar'] {
          display: none;
        }

        [part='toolbar'] {
          position: absolute;
          bottom: 0;
          display: flex;
          padding-right: var(--lumo-space-m);
          border-top-right-radius: var(--lumo-border-radius);
          background-color: var(--lumo-tint-10pct);
          user-select: none;
          transition: all 0.2s;
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
        }

        #zoom span {
          margin: auto;
          margin-left: var(--lumo-space-m);
        }
      </style>
      <slot id="svgSlot" name="svg"></slot>
      <div part="toolbar">
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
    return '0.1.2';
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
        value: SVG
      },
      /**
       * Enable pan and zoom functionality
       * @type {Boolean}
       */
      zoomable: {
        type: Boolean,
        reflectToAttribute: true,
        value: false
      },
      /**
       * Current zoom and pan information
       * @type {Object}
       */
      panZoomInfo: {
        type: Object,
        value: () => ({ scale: '100%', x: '0', y: '0' })
      }
    };
  }

  static get observers() {
    return ['_zoomableChanged(zoomable, draw)', '_transformChanged(_transform, _transform.*)'];
  }

  ready() {
    super.ready();
    this.$.resetZoom.addEventListener('click', () => this.resetZoom());
    this.$.svgSlot.addEventListener('slotchange', () => this._onSvgSlotChange());
    if (!this.$.svgSlot.assignedNodes().length) {
      SVG()
        .addTo(this)
        .attr({ slot: 'svg' });
    }
  }

  get children() {
    return this.draw.children();
  }

  viewbox(...args) {
    if (this._svg) this._svg.viewbox(...args);
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
      this._svg = SVG(slotted[0]).attr({});
      this.set('draw', this._svg);
    }
  }

  _zoomableChanged(zoomable, draw) {
    if (draw && this._svg) {
      this._setZoomContainer(zoomable);
      this._setPanZoomEvents(zoomable);
    }
  }

  _transformChanged(transform) {
    this.$.zoom.style.opacity = 0.6;
    this.panZoomInfo = {
      scale: `${Math.floor(transform.k * 100)}%`,
      x: `x: ${Math.floor(transform.x)}`,
      y: `y: ${Math.floor(transform.y)}`
    };
    this.__debounce(() => (this.$.zoom.style.opacity = 0), 2000);
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
}

export * from '@svgdotjs/svg.js';

customElements.define(VcfSvg.is, VcfSvg);

/**
 * @namespace Vaadin
 */
window.Vaadin.VcfSvg = VcfSvg;
