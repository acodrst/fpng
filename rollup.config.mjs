import { createRollupLicensePlugin } from 'rollup-license-plugin';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
export default {
  input: 'src/fpng.js',
  output: { file: 'dist/fpng.bundle.js', inlineDynamicImports: true, sourcemap: false },
  plugins: [    replace({
      'window.pako': 'globalThis.pako',
      'preventAssignment':false}), nodeResolve(), createRollupLicensePlugin({ outputFilename: 'app_licenses.json' })]
}