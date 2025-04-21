/**
 * @fileoverview Rule to check if SVG contains oversized base64 images
 */

const fs = require('fs').promises
const path = require('path')
const { DOMParser } = require('@xmldom/xmldom')

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Check if SVG contains oversized base64 images',
      category: 'Possible Errors',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxSizeRatio: {
            type: 'number',
            default: 2,
          },
          ignorePaths: {
            type: 'array',
            items: {
              type: 'string',
            },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      oversizedImage:
        'Image dimensions ({{imageWidth}}x{{imageHeight}}) are larger than SVG dimensions ({{svgWidth}}x{{svgHeight}}) in file {{filename}}. This may cause performance issues.',
      invalidSvg: 'Invalid SVG file: {{error}}',
      missingSvgDimensions: 'SVG file is missing width or height attributes',
    },
  },

  create(context) {
    const options = context.options[0] || {}
    const maxSizeRatio = options.maxSizeRatio || 2
    const ignorePaths = options.ignorePaths || []

    function shouldIgnoreFile(filePath) {
      const relativePath = path.relative(process.cwd(), filePath)
      return ignorePaths.some((ignorePath) => {
        const ignorePattern = new RegExp(ignorePath.replace('*', '.*'))
        return ignorePattern.test(relativePath)
      })
    }

    function parseSvgContent(content) {
      const parser = new DOMParser()
      return parser.parseFromString(content, 'application/xml')
    }

    async function checkSvgContent(filePath, content) {
      try {
        const doc = parseSvgContent(content)
        const svg = doc.documentElement

        if (!svg || svg.nodeName !== 'svg') {
          context.report({
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
            messageId: 'invalidSvg',
            data: { error: 'Not a valid SVG file' },
          })
          return
        }

        const svgWidth = parseInt(svg.getAttribute('width'), 10)
        const svgHeight = parseInt(svg.getAttribute('height'), 10)

        if (!svgWidth || !svgHeight) {
          context.report({
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
            messageId: 'missingSvgDimensions',
          })
          return
        }

        const images = svg.getElementsByTagName('image')
        for (let i = 0; i < images.length; i++) {
          const image = images[i]
          const imageWidth = parseInt(image.getAttribute('width'), 10)
          const imageHeight = parseInt(image.getAttribute('height'), 10)
          const href =
            image.getAttribute('href') || image.getAttribute('xlink:href')

          if (!imageWidth || !imageHeight || !href) continue

          if (href.startsWith('data:image')) {
            if (
              imageWidth > svgWidth * maxSizeRatio ||
              imageHeight > svgHeight * maxSizeRatio
            ) {
              context.report({
                loc: {
                  start: { line: 1, column: 0 },
                  end: { line: 1, column: 0 },
                },
                messageId: 'oversizedImage',
                data: {
                  imageWidth,
                  imageHeight,
                  svgWidth,
                  svgHeight,
                  filename: path.relative(process.cwd(), filePath),
                },
              })
            }
          }
        }
      } catch (error) {
        context.report({
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
          messageId: 'invalidSvg',
          data: { error: error.message },
        })
      }
    }

    async function checkSvgFile(filePath) {
      try {
        if (shouldIgnoreFile(filePath)) {
          return
        }

        const content = await fs.readFile(filePath, 'utf8')
        await checkSvgContent(filePath, content)
      } catch (error) {
        context.report({
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
          messageId: 'invalidSvg',
          data: { error: error.message },
        })
      }
    }

    return {
      Program(node) {
        const filename = context.getFilename()
        checkSvgFile(filename).catch((error) => {
          context.report({
            loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
            messageId: 'invalidSvg',
            data: { error: error.message },
          })
        })
      },
    }
  },
}
