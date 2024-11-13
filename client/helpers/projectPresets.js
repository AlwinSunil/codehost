export const presets = [
  {
    name: "Vite Js",
    image: "/logos/vitejs.svg",
    value: "VITEJS",
    config: {
      installCommand: "npm install",
      buildCommand: "npm run build",
      outputDir: "dist",
    },
  },
  {
    name: "Create React App",
    image: "/logos/cra.svg",
    value: "CRA",
    config: {
      installCommand: "npm install",
      buildCommand: "npm run build",
      outputDir: "build",
    },
  },
];

export const configDefaults = {
  VITEJS: {
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDir: "dist",
  },
  CRA: {
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDir: "build",
  },
};
