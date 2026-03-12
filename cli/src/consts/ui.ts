export interface UiTrack {
  name: string;
  description: string;
  tags: string[];
  geotags: string[];
  country: string;
  city: string;
  length: string;
  width: string;
  pitboxes: string;
  run: string;
}

export function defaultUiTrack(name: string): UiTrack {
  return {
    name,
    description: "",
    tags: ["circuit", "mod", name],
    geotags: [],
    country: "",
    city: "",
    length: "",
    width: "",
    pitboxes: "0",
    run: "clockwise",
  };
}
