export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type AgentKind = "control" | "text" | "void";

export interface AgentNode {
  kind: AgentKind;
  role: string;
  name: string;
  box: Box;
  letterId?: string;
  state?: string;
}

function letterOf(el: Element): { letterId?: string; state?: string } {
  const host = el.closest("[data-letter-id]");
  if (!host) return {};
  return {
    letterId: host.getAttribute("data-letter-id") ?? undefined,
    state: host.getAttribute("data-state") ?? undefined,
  };
}

const INPUT_ROLES: Record<string, string> = {
  button: "button",
  submit: "button",
  reset: "button",
  image: "button",
  checkbox: "checkbox",
  radio: "radio",
  range: "slider",
  number: "spinbutton",
  search: "searchbox",
};

const TAG_ROLES: Record<string, string> = {
  button: "button",
  select: "combobox",
  textarea: "textbox",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  dialog: "dialog",
  progress: "progressbar",
  meter: "meter",
  summary: "button",
  details: "group",
  output: "status",
};

const CONTROL_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "radio",
  "slider",
  "spinbutton",
  "searchbox",
  "textbox",
  "combobox",
  "switch",
  "tab",
  "menuitem",
  "option",
  "heading",
  "img",
  "dialog",
  "progressbar",
  "meter",
  "status",
  "alert",
  "listbox",
  "menu",
  "tablist",
  "group",
]);

export function roleOf(el: Element): string | null {
  const explicit = el.getAttribute("role")?.trim().split(/\s+/)[0];
  if (explicit && explicit !== "presentation" && explicit !== "none") return explicit;
  if (explicit) return null;
  const tag = el.tagName.toLowerCase();
  if (tag === "a") return el.hasAttribute("href") ? "link" : null;
  if (tag === "input") {
    const type = (el.getAttribute("type") ?? "text").toLowerCase();
    if (type === "hidden") return null;
    return INPUT_ROLES[type] ?? "textbox";
  }
  if (tag === "img") return el.getAttribute("alt") === "" ? null : "img";
  if (tag === "svg") return el.querySelector("title") ? "img" : null;
  if (el.hasAttribute("contenteditable") && el.getAttribute("contenteditable") !== "false") {
    return "textbox";
  }
  return TAG_ROLES[tag] ?? null;
}

function squash(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function textFrom(el: Element): string {
  let out = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) out += ` ${node.textContent ?? ""}`;
    else if (node instanceof Element && !isHidden(node)) {
      const alt = node.tagName.toLowerCase() === "img" ? node.getAttribute("alt") : null;
      out += ` ${alt ?? (node.getAttribute("aria-label") || textFrom(node))}`;
    }
  });
  return squash(out);
}

export function nameOf(el: Element): string {
  const doc = el.ownerDocument;
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => doc.getElementById(id))
      .filter((n): n is HTMLElement => n !== null)
      .map((n) => textFrom(n))
      .join(" ");
    if (squash(text)) return squash(text);
  }
  const label = squash(el.getAttribute("aria-label"));
  if (label) return label;
  const tag = el.tagName.toLowerCase();
  if (tag === "img") return squash(el.getAttribute("alt"));
  if (tag === "svg") return squash(el.querySelector("title")?.textContent);
  if (tag === "input" || tag === "select" || tag === "textarea") {
    const type = (el.getAttribute("type") ?? "").toLowerCase();
    if (["button", "submit", "reset"].includes(type)) {
      return squash(el.getAttribute("value")) || (type === "submit" ? "Submit" : "");
    }
    const id = el.getAttribute("id");
    const forLabel = id ? doc.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    const wrap = el.closest("label");
    const fromLabel = forLabel ?? wrap;
    if (fromLabel) return textFrom(fromLabel);
    return squash(el.getAttribute("placeholder")) || squash(el.getAttribute("title"));
  }
  if (tag === "iframe") return squash(el.getAttribute("title"));
  const role = roleOf(el);
  if (role && role !== "group" && role !== "dialog" && role !== "listbox" && role !== "menu") {
    const text = textFrom(el);
    if (text) return text;
  }
  return squash(el.getAttribute("title"));
}

export function isHidden(el: Element): boolean {
  if (el.getAttribute("aria-hidden") === "true") return true;
  if (el.hasAttribute("hidden") || el.hasAttribute("inert")) return true;
  const view = el.ownerDocument.defaultView;
  if (view && el instanceof view.HTMLElement) {
    const style = view.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return true;
  }
  return false;
}

function ownText(el: Element): string {
  let out = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) out += node.textContent ?? "";
  });
  return squash(out);
}

export interface ReadOptions {
  skip?: (el: Element) => boolean;
  offset?: { x: number; y: number };
  measure?: (el: Element) => Box;
}

function defaultMeasure(el: Element): Box {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

export function readPage(root: Element, options: ReadOptions = {}): AgentNode[] {
  const out: AgentNode[] = [];
  const offset = options.offset ?? { x: 0, y: 0 };
  const measure = options.measure ?? defaultMeasure;

  const place = (el: Element): Box | null => {
    const b = measure(el);
    if (b.w < 1 || b.h < 1) return null;
    return { x: b.x + offset.x, y: b.y + offset.y, w: b.w, h: b.h };
  };

  const visit = (el: Element) => {
    if (options.skip?.(el)) return;
    if (isHidden(el)) return;
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "template" || tag === "noscript") return;

    if (tag === "canvas") {
      const box = place(el);
      if (box) {
        out.push({
          kind: "void",
          role: "canvas",
          name: squash(el.getAttribute("aria-label")) || textFrom(el),
          box,
        });
      }
      return;
    }

    if (tag === "iframe") {
      const frame = el as HTMLIFrameElement;
      let inner: Document | null;
      try {
        inner = frame.contentDocument;
      } catch {
        inner = null;
      }
      const box = place(el);
      if (inner?.body && box) {
        out.push(
          ...readPage(inner.body, {
            ...options,
            measure: defaultMeasure,
            offset: { x: box.x, y: box.y },
          }),
        );
      }
      return;
    }

    const role = roleOf(el);
    if (role && CONTROL_ROLES.has(role)) {
      const box = place(el);
      if (box) out.push({ kind: "control", role, name: nameOf(el), box, ...letterOf(el) });
      if (role !== "group" && role !== "dialog" && role !== "listbox" && role !== "menu" && role !== "tablist") {
        el.querySelectorAll("canvas").forEach((c) => visit(c));
        return;
      }
    } else {
      const text = ownText(el);
      if (text) {
        const box = place(el);
        if (box) out.push({ kind: "text", role: "text", name: text, box, ...letterOf(el) });
      }
    }

    const shadow = (el as HTMLElement).shadowRoot;
    const children = shadow ? [...shadow.children, ...el.children] : [...el.children];
    children.forEach(visit);
  };

  visit(root);
  return out;
}

export function summarize(nodes: AgentNode[]): {
  controls: number;
  unnamed: number;
  voids: number;
} {
  const controls = nodes.filter((n) => n.kind === "control");
  return {
    controls: controls.length,
    unnamed: controls.filter((n) => !n.name).length,
    voids: nodes.filter((n) => n.kind === "void").length,
  };
}
