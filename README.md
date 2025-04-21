# eslint-plugin-svg-size

An ESLint plugin that checks image dimensions in SVG files to prevent performance issues caused by oversized base64 images.

## Installation

```bash
npm install eslint-plugin-svg-size --save-dev
# or
yarn add eslint-plugin-svg-size --dev
```

## Usage

Add the plugin to your `.eslintrc.js` or `.eslintrc.json`:

```javascript
{
  "plugins": ["svg-size"],
  "rules": {
    "svg-size/check-image-size": "error"
  }
}
```

## Rule Details

### svg-size/check-image-size

This rule checks if the dimensions of base64 images within SVG files exceed a specified ratio of the SVG container's dimensions.

#### Options

```javascript
{
  "rules": {
    "svg-size/check-image-size": ["error", {
      // Maximum allowed ratio between image and SVG container dimensions
      "maxSizeRatio": 2,
      // Paths to ignore (supports glob patterns)
      "ignorePaths": [
        "assets/icons/*",
        "public/images/*"
      ]
    }]
  }
}
```

#### Default Options

```javascript
{
  "maxSizeRatio": 2,
  "ignorePaths": []
}
```

## Invalid Examples

```xml
<!-- bad.svg -->
<svg width="100" height="100">
  <!-- Image dimensions (300x300) exceed 2x the SVG container (100x100) -->
  <image width="300" height="300" href="data:image/png;base64,..." />
</svg>
```

## Valid Examples

```xml
<!-- good.svg -->
<svg width="100" height="100">
  <!-- Image dimensions (150x150) are within 2x the SVG container (100x100) -->
  <image width="150" height="150" href="data:image/png;base64,..." />
</svg>
```

## Error Messages

The plugin will report errors in the following cases:

1. Invalid SVG file format

```
Invalid SVG file: [error message]
```

2. Missing width or height attributes in SVG

```
SVG file is missing width or height attributes
```

3. Image dimensions exceed the limit

```
Image dimensions (300x300) are larger than SVG dimensions (100x100) in file example.svg. This may cause performance issues.
```