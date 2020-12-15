# &lt;vcf-svg&gt;

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vaadin/web-components?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![npm version](https://badgen.net/npm/v/@vaadin-component-factory/vcf-svg)](https://www.npmjs.com/package/@vaadin-component-factory/vcf-svg)
[![Published on Vaadin Directory](https://img.shields.io/badge/Vaadin%20Directory-published-00b4f0.svg)](https://vaadin.com/directory/component/vaadin-component-factoryvcf-svg)

Web Component for manipulating and animating [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG).

- Web Component wrapper for the JS library [SVG.js](https://svgjs.com/docs/3.0).
- Zoom and pan functionality implemented with [d3-zoom](https://github.com/d3/d3-zoom).
- Draggable functionality implemented with plugin [svg.draggable.js](https://github.com/svgdotjs/svg.draggable.js).

![Screenshot 2020-06-11 at 15 34 34](https://user-images.githubusercontent.com/3392815/84385972-2853ac00-abf9-11ea-8604-fef5a8d55315.png)

[Live demo ↗](https://vcf-svg.netlify.com)
|
[API documentation ↗](https://vcf-svg.netlify.com/api/#/elements/Vaadin.VcfSvg)

## Installation

Install `vcf-svg`:

```sh
npm i @vaadin-component-factory/vcf-svg --save
```

## Usage

Once installed, import it in your application:

```js
import '@vaadin-component-factory/vcf-svg';
```

Add `<vcf-svg>` element to the page.

```html
<vcf-svg zoomable>
  <svg viewbox="0 0 400 200">
    <rect x="0" y="0" width="100" height="100" draggable="true"></rect>
  </svg>
</vcf-svg>
```

## Running demo

1. Fork the `vcf-svg` repository and clone it locally.

1. Make sure you have [npm](https://www.npmjs.com/) installed.

1. When in the `vcf-svg` directory, run `npm install` to install dependencies.

1. Run `npm start` to open the demo.

## Server-side API

This is the client-side (Polymer 3) web component. If you are looking for this web components server-side (Java) API for the Vaadin Platform, it can be found here: [Svg Component](https://vaadin.com/directory/component/svg-component)



## License & Author

This Add-on is distributed under Apache 2.0

Component Factory svg is written by Vaadin Ltd.

### Sponsored development
Major pieces of development of this add-on has been sponsored by multiple customers of Vaadin. Read more  about Expert on Demand at: [Support](https://vaadin.com/support) and  [Pricing](https://vaadin.com/pricing)


