import { useEffect, useRef } from "react";
import type { LetterProps } from "./types";

const TAG = "greet-form";

const TEMPLATE = `
<style>
  :host { display: block; }
  label { display: block; margin-bottom: 8px; }
  input { font: inherit; padding: 8px 10px; border-radius: 6px; border: 1px solid #8892b0; margin-right: 8px; }
  button { font: inherit; padding: 8px 16px; border-radius: 6px; border: 0; background: #4f7cff; color: #fff; cursor: pointer; }
  output { display: block; margin-top: 16px; font-size: 1.5rem; min-height: 2rem; }
</style>
<label for="name">Your name</label>
<input id="name" type="text" autocomplete="off" />
<button type="button">Greet</button>
<output></output>
`;

export interface GreetFormElement extends HTMLElement {
  wrong: boolean;
}

function define() {
  if (customElements.get(TAG)) return;
  customElements.define(
    TAG,
    class extends HTMLElement {
      wrong = false;
      #ready = false;
      connectedCallback() {
        if (this.#ready) return;
        this.#ready = true;
        const root = this.attachShadow({ mode: "closed" });
        root.innerHTML = TEMPLATE;
        const input = root.querySelector("input");
        const button = root.querySelector("button");
        const output = root.querySelector("output");
        button?.addEventListener("click", () => {
          if (!input || !output) return;
          const name = this.wrong ? "" : input.value.trim();
          output.textContent = `Hello, ${name}!`;
        });
      }
    },
  );
}

export default function ShadowForm({ variant }: LetterProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    define();
    const slot = host.current;
    if (!slot) return;
    const el = document.createElement(TAG) as GreetFormElement;
    el.wrong = variant === "broken";
    slot.appendChild(el);
    return () => {
      el.remove();
    };
  }, [variant]);

  return <div className="letter-widget" ref={host} />;
}
