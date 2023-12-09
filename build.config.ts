import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  rollup: {
    inlineDependencies: true,
    esbuild: {
      minify: true
    }
  },

  clean: true,
  declaration: false,
})
