require("@babel/register")({
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
      },
    ],
    "@babel/preset-typescript",
  ],
  plugins: [],
  extensions: [".ts", ".tsx"],
  babelrc: false,
});

require("dotenv").config({ path: ".env.local" });

require("./src/contentful/pull")
  .pullFromContentful()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
