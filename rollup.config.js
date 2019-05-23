import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel'
import { eslint } from 'rollup-plugin-eslint'
import { terser } from 'rollup-plugin-terser'

const production = !process.env.ROLLUP_WATCH

export default {
  input: 'lib/index.js',
  output: {
    name: 'magic',
    file: 'dist/magic-dom.js', // 输出文件
    format: 'umd'
  },
  plugins: [
    json(),
    eslint({
      fix: true,
      include: [
        'lib/**',
      ],
      throwOnError: true
    }),
    babel({
      babelrc: false,
      presets: [
        [
          "@babel/preset-env",
          {
            modules: false
          }
        ]
      ]
    }),
    production && terser()
  ]
}
