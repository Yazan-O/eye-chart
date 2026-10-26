import { useEffect, useRef, useState } from "react";

export default function Shot({ src, alt, testId }: { src: string; alt: string; testId: string }) {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closer.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    opener.current?.focus();
  };

  return (
    <>
      <button
        ref={opener}
        type="button"
        className="shot"
        aria-label={`${alt}, enlarge`}
        onClick={() => setOpen(true)}
        data-testid={testId}
      >
        <img src={src} alt={alt} loading="lazy" />
        <span className="shot-hint">Click to enlarge</span>
      </button>
      {open && (
        <div className="shot-zoom" role="dialog" aria-modal="true" aria-label={alt} onClick={close} data-testid={`${testId}-zoom`}>
          <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
          <div className="shot-zoom-bar">
            <a href={src} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              Open full size
            </a>
            <button ref={closer} type="button" className="button" onClick={close} data-testid={`${testId}-close`}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
