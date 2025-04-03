# Barcode scanner

A customizable and responsive barcode scanner React component built with `@zxing/browser` and `styled-components`. It supports torch (flashlight) control and focuses scan attempts within a defined overlay area to enhance performance and accuracy.

## Features

- Video-based QR and barcode scanning using `@zxing/browser`
- Torch (flashlight) control via the video track, where supported
- Overlay UI to guide users toward the optimal scanning zone
- Supports multiple barcode formats including:
  - `CODE_128`
  - `EAN_13`
  - `DATA_MATRIX`
- Imperative `stop()` method exposed via `ref` for external control
- Auto-shutdown after 20 seconds of inactivity
- Fully styled with `styled-components`

## Installation

```bash
npm install @zxing/browser styled-components
```
