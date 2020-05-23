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
import '@vaadin/vaadin-license-checker/vaadin-license-checker';

/**
 * `<vcf-svg>` Web component for manipulating and animating SVG graphics.
 *
 * ```html
 * <vcf-svg></vcf-svg>
 * ```
 *
 * ### Styling
 *
 * The following custom properties are available for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|-------------
 * `--vcf-svg-property` | Example custom property | `unset`
 *
 * The following shadow DOM parts are available for styling:
 *
 * Part name | Description
 * ----------------|----------------
 * `part` | Example part
 *
 * The following state attributes are available for styling:
 *
 * Attribute    | Description | Part name
 * -------------|-------------|------------
 * `attribute` | Example styling attribute | :host
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
        }
      </style>
      <slot id="svgSlot" name="svg"></slot>
    `;
  }

  static get is() {
    return 'vcf-svg';
  }

  static get version() {
    return '0.1.1';
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
      }
    };
  }

  ready() {
    super.ready();
    this.draw = SVG()
      .addTo(this)
      .attr({ slot: 'svg' });
    this.$.svgSlot.addEventListener('slotchange', () => this._onSvgSlotChange());
  }

  _onSvgSlotChange() {
    const slotted = this.$.svgSlot.assignedNodes().filter(node => node.tagName.toLowerCase() === 'svg');
    if (slotted.length) this.draw = SVG(slotted[0]);
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
