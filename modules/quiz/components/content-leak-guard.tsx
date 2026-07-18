"use client";

import {
  useEffect,
  type DragEvent,
  type ReactNode,
  type ClipboardEvent,
  type MouseEvent,
} from "react";

import { cn } from "@/lib/utils";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

/**
 * Soft leak deterrents for assessment content.
 * Cannot block OS screenshots or screen recording in the browser.
 */
export function ContentLeakGuard({
  children,
  watermark,
  className,
}: {
  children: ReactNode;
  /** Traceable label shown as a faint repeating watermark (e.g. quiz + code). */
  watermark?: string;
  className?: string;
}) {
  useEffect(() => {
    function blockClipboard(event: Event) {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    }

    function blockContextMenu(event: Event) {
      if (isEditableTarget(event.target)) {
        return;
      }
      event.preventDefault();
    }

    document.addEventListener("copy", blockClipboard, true);
    document.addEventListener("cut", blockClipboard, true);
    document.addEventListener("contextmenu", blockContextMenu, true);

    return () => {
      document.removeEventListener("copy", blockClipboard, true);
      document.removeEventListener("cut", blockClipboard, true);
      document.removeEventListener("contextmenu", blockContextMenu, true);
    };
  }, []);

  function handleCopy(event: ClipboardEvent<HTMLDivElement>) {
    if (!isEditableTarget(event.target)) {
      event.preventDefault();
    }
  }

  function handleContextMenu(event: MouseEvent<HTMLDivElement>) {
    if (!isEditableTarget(event.target)) {
      event.preventDefault();
    }
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    if (!isEditableTarget(event.target)) {
      event.preventDefault();
    }
  }

  return (
    <div
      className={cn(
        "content-leak-guard relative select-none",
        "[&_input]:select-text [&_textarea]:select-text",
        className,
      )}
      onCopy={handleCopy}
      onCut={handleCopy}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      {watermark ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div
            className="absolute inset-[-40%] flex flex-wrap content-center gap-x-16 gap-y-24 opacity-[0.06]"
            style={{ transform: "rotate(-24deg)" }}
          >
            {Array.from({ length: 48 }).map((_, index) => (
              <span
                key={index}
                className="shrink-0 whitespace-nowrap font-mono text-sm tracking-wide"
              >
                {watermark}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
