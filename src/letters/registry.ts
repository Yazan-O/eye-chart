import type { ComponentType } from "react";
import AnimatedTotal from "./AnimatedTotal";
import CanvasSlider from "./CanvasSlider";
import Counter from "./Counter";
import HoverMenu from "./HoverMenu";
import ShadowForm from "./ShadowForm";
import Toast from "./Toast";
import VirtualList from "./VirtualList";
import WebglKnob from "./WebglKnob";
import type { Variant } from "./types";
import "./twin.css";

export type { Variant } from "./types";

export interface Letter {
  id: string;
  row: number;
  glyph: string;
  name: string;
  trap: string;
  howToUse: string;
  brokenBehaviour: string;
  lens?: { name: string; summary: string; diff: string };
  Component: ComponentType<{ variant: Variant }>;
}

export const letters: Letter[] = [
  {
    id: "counter",
    row: 1,
    glyph: "E",
    name: "Counter",
    trap: "None. Plain DOM buttons and text; the control letter.",
    howToUse: "Click Add one. The count goes up by one per click.",
    brokenBehaviour: "Each click adds two, so three clicks show 6.",
    Component: Counter,
  },
  {
    id: "toast",
    row: 2,
    glyph: "F",
    name: "Toast",
    trap: "The confirmation is on screen for only 1.5 seconds.",
    howToUse: "Click Save. A Saved notice appears briefly.",
    brokenBehaviour: "Clicking Save does nothing; no notice ever appears.",
    Component: Toast,
  },
  {
    id: "hover-menu",
    row: 3,
    glyph: "P",
    name: "Hover menu",
    trap: "The menu exists only while the mouse hovers over it.",
    howToUse: "Hover over Menu, then click an item. The page name changes to that item.",
    brokenBehaviour: "Clicking Settings opens Sign out; every item opens the next one.",
    Component: HoverMenu,
  },
  {
    id: "shadow-form",
    row: 4,
    glyph: "T",
    name: "Closed shadow form",
    trap: "The form lives in a closed shadow root that page scripts cannot reach.",
    howToUse: "Type your name and click Greet. The page says Hello, followed by your name.",
    brokenBehaviour: "The greeting drops the name and reads Hello, !",
    Component: ShadowForm,
  },
  {
    id: "animated-total",
    row: 5,
    glyph: "O",
    name: "Animated total",
    trap: "The number counts up for 3 seconds unless reduced motion is on.",
    howToUse: "Click Load total. The total counts up to 1,250.",
    brokenBehaviour: "The total settles at 1,205 instead of 1,250.",
    Component: AnimatedTotal,
  },
  {
    id: "virtual-list",
    row: 6,
    glyph: "Z",
    name: "Virtual list",
    trap: "Only the rows in view exist in the page; the rest are created on scroll.",
    howToUse: "Scroll to an item and click it. The selection shows that item.",
    brokenBehaviour: "Clicking a row selects the row below it.",
    Component: VirtualList,
  },
  {
    id: "canvas-slider",
    row: 7,
    glyph: "L",
    name: "Canvas slider",
    trap: "The slider is pixels on a 2D canvas with no DOM handle.",
    howToUse: "Drag the round handle along the scale from 0 to 100. The readout shows the value.",
    brokenBehaviour: "The readout shows 100 minus the value, so 70 reads 30.",
    Component: CanvasSlider,
  },
  {
    id: "webgl-knob",
    row: 8,
    glyph: "D",
    name: "WebGL knob",
    trap: "The knob is a three.js mesh drawn by WebGL.",
    howToUse: "Press on the knob and drag up to turn it up, one step per 20 pixels, from 0 to 10.",
    brokenBehaviour: "The knob turns but the readout stays at 0.",
    Component: WebglKnob,
  },
];

export function findLetter(id: string | undefined) {
  return letters.find((l) => l.id === id);
}
