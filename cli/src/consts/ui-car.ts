export interface UiCarSpecs {
  bhp: string;
  torque: string;
  weight: string;
  topspeed: string;
  acceleration: string;
  pwratio: string;
  range: number;
}

export interface UiCar {
  name: string;
  brand: string;
  description: string;
  tags: string[];
  class: string;
  specs: UiCarSpecs;
  torqueCurve: number[][];
  powerCurve: number[][];
  country: string;
  author: string;
  version: string;
  url: string;
  year: number;
}

export function defaultUiCar(name: string): UiCar {
  return {
    name,
    brand: "",
    description: "",
    tags: ["race", "mod", name],
    class: "race",
    specs: {
      bhp: "",
      torque: "",
      weight: "",
      topspeed: "",
      acceleration: "",
      pwratio: "",
      range: 80,
    },
    torqueCurve: [],
    powerCurve: [],
    country: "",
    author: "",
    version: "1.0",
    url: "",
    year: new Date().getFullYear(),
  };
}
