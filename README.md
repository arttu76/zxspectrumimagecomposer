[![Node.js CI](https://github.com/arttu76/zxspectrumimagecomposer/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/arttu76/zxspectrumimagecomposer/actions/workflows/node.js.yml)

# ZX Spectrum Image Composer

![Screenshot](deployment/screenshot.png)

## What is it?
ZX Spectrum Image Composer is a one page web application that allows the user to:
1. Upload image and convert it to ZX Spectrum format
2. Mask parts of the image, so only specific area is visible
3. Manually edit ZX Spectrum pixels
4. Manually edit ZX Spectrum attributes
5. Export full or part of the image in various formats

The application can be used in https://zxspectrumimagecomposer.solvalou.com/

## How it works

### Layers

Like Adobe Photoshop, you have one or more image layers. Each layer is an individual sheet with its own settings (on the right side of the screen) and the final image is the composite of all the layers.

### Each layer consist of four sub-layers

Each layer consists of four sub-layers:
1. Source image: You can have one source image (=any image you paste or upload) per layer and you can use various image adjustment settings to adjust brightness/contrast/etc. One important part of the adjustments is pixelation: how the image is adapted to ZX Spectrum resolution and color limitations. _You don't have to have a source image_ if you want to draw the layer's contents yourself.
2. Mask: This layer does not actually _show_ anything. It is used to mask out part of the source image. Masked parts are invisible, unmasked parts are visible.
3. Manually drawn pixels: This sub-layer allows you to manually set each pixel as ink, paper or transparent. If a pixel is set as ink or paper, that pixel will override the source image. If a pixel is set as transparent, the source image will "show through", unless the mask prevents it from being visible.
4. Manually drawn attributes: This layer is the same as "manually drawn pixels", but instead of pixels, it deals with color attributes.

### Example workflow using sub-layers effectively

As brightness/contrast/etc adjustments don't affect manually drawn pixels or attributes, copying the dithered image to "manual pixels" and "manual attributes" -sub layers (using the leftmost icon in the Freeze-section of the top toolbar) will freeze the image from dithering algorithm. So what you can do to "spectrumize" a complex image requiring different dithering settings for different areas is to:

1. Mask all of the image
2. Unmask the part of it you're going to work on next
3. Adjust image controls so that unmasked part is optimally dithered
4. Freeze the unmasked part (copying the unmasked automatically dithered part to manual sub-layers as if you had drawn them manually - note, that, if you had made any manual changes beforehand, they will _not_ be lost)
5. Repeat steps 2-4 until done

## Technical info

### Structure

The app is a react/redux app using only a few dependencies (react, redux, tooltip, material symbols). There is no backend at all, the whole app is just a bunch of static files and couple of decorative images.

The app stores its state in couple of redux slices, but due to large amount of data (=multiple large images with related metadata in various image layers), some of the data is stored as window attributes (by `windowProperyMiddleware`) for performance reasons. The data is also persisted to window.localStorage (by `localStorageMiddleware`) so reloading the page does not destroy the state.

### Building the app

Clone the repo, install dependencies with `npm install` and start a development server with `npm run dev`. Now when you edit the files, the app in your browser updates automatically.

To make a production build, do `npm run build`.

Deployment scripts (for my personal use, you probably don't have any use for them) are in deployment. You can ignore them as well as the `npm run redeploy` script.
