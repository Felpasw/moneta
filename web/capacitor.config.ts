import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.moneta",
  appName: "Moneta",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
