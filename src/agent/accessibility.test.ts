import { afterEach, describe, expect, it } from "vitest";
import { nameOf, readPage, roleOf, summarize } from "./accessibility";

const box = () => ({ x: 0, y: 0, w: 10, h: 10 });

function mount(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("roleOf and nameOf", () => {
  it("maps native elements to roles", () => {
    const root = mount(
      '<a href="#x">Go</a><a>No href</a><input type="range"><input type="checkbox"><h2>Title</h2><img alt="">',
    );
    expect([...root.children].map(roleOf)).toEqual([
      "link",
      null,
      "slider",
      "checkbox",
      "heading",
      null,
    ]);
  });

  it("names from aria-label, labelledby, label and text", () => {
    const root = mount(
      '<span id="l">Volume</span><div role="slider" aria-labelledby="l"></div>' +
        '<label for="e">Email</label><input id="e">' +
        '<button aria-label="Close dialog">x</button><button><img alt="Save"> now</button>',
    );
    const [, slider, , input, close, save] = [...root.children];
    expect(nameOf(slider!)).toBe("Volume");
    expect(nameOf(input!)).toBe("Email");
    expect(nameOf(close!)).toBe("Close dialog");
    expect(nameOf(save!)).toBe("Save now");
  });
});

describe("readPage", () => {
  it("reports controls, text and canvases, and skips hidden parts", () => {
    const root = mount(
      '<p>Count: 3</p><button>Add one</button><div role="button"></div>' +
        '<canvas width="10" height="10"></canvas>' +
        '<div aria-hidden="true"><button>Ghost</button></div><button hidden>Gone</button>',
    );
    const nodes = readPage(root, { measure: box });
    expect(nodes.map((n) => `${n.kind}:${n.role}:${n.name}`)).toEqual([
      "text:text:Count: 3",
      "control:button:Add one",
      "control:button:",
      "void:canvas:",
    ]);
    expect(summarize(nodes)).toEqual({ controls: 2, unnamed: 1, voids: 1 });
  });

  it("reads into open shadow roots and skips the overlay", () => {
    const root = mount('<div id="host"></div><div data-agent-overlay><button>Mine</button></div>');
    const host = root.querySelector("#host")!;
    host.attachShadow({ mode: "open" }).innerHTML = "<button>Inside</button>";
    const nodes = readPage(root, {
      measure: box,
      skip: (el) => el.hasAttribute("data-agent-overlay"),
    });
    expect(nodes.map((n) => n.name)).toEqual(["Inside"]);
  });

  it("still finds a canvas the page hides from assistive tech", () => {
    const root = mount('<div aria-hidden="true"><canvas></canvas><button>Ghost</button></div>');
    const nodes = readPage(root, { measure: box });
    expect(nodes.map((n) => `${n.kind}:${n.role}`)).toEqual(["void:canvas"]);
  });

  it("drops elements with no size", () => {
    const root = mount("<button>Zero</button>");
    expect(readPage(root, { measure: () => ({ x: 0, y: 0, w: 0, h: 0 }) })).toEqual([]);
  });
});
