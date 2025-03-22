import path from "path"
import webpack from "webpack"

const config: webpack.Configuration = {
  mode: "development",
  entry: "./src/presentation/adapters/beat.ts",
  /*
  externals: {
    ws: "commonjs ws",
  },
  */
  output: {
    path: path.resolve(__dirname, "dist", "beat"),
    filename: "plugin.js"
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],
    // Add support for TypeScripts fully qualified ESM imports.
    extensionAlias: {
      ".js": [".js", ".ts"],
      ".cjs": [".cjs", ".cts"],
      ".mjs": [".mjs", ".mts"]
    }
  },
  module: {
    rules: [
      // all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" }
    ]
  }
};

export default config;
