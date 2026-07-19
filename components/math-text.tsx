"use client";

import katex from "katex";
import { useMemo, useState, type MouseEvent } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import "katex/dist/katex.min.css";

type Segment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; display: boolean };

const MATH_SPLIT =
  /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g;

function splitMathSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MATH_SPLIT)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const display = Boolean(match[1] || match[3]);
    const value = match[1] ?? match[2] ?? match[3] ?? match[4] ?? "";
    segments.push({ type: "math", value, display });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: "text", value: text });
  }

  return segments;
}

function renderKatex(value: string, displayMode: boolean) {
  try {
    return katex.renderToString(value, {
      throwOnError: false,
      displayMode,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return null;
  }
}

export function MathText({
  text,
  className,
  as: Component = "span",
}: {
  text: string;
  className?: string;
  as?: "span" | "p" | "h3" | "h4" | "div";
}) {
  const segments = useMemo(() => splitMathSegments(text), [text]);

  return (
    <Component
      className={cn("wrap-anywhere whitespace-pre-wrap", className)}
    >
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.value}</span>;
        }

        const html = renderKatex(segment.value, segment.display);
        if (!html) {
          return <span key={index}>{segment.value}</span>;
        }

        return (
          <span
            key={index}
            className={cn(
              "katex-host text-[1.05em] leading-normal text-foreground",
              segment.display && "my-2 block overflow-x-auto",
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </Component>
  );
}

/**
 * Field that shows rendered math at rest; click to edit the raw source.
 */
export function MathSourceField({
  value,
  onChange,
  placeholder,
  disabled = false,
  multiline = false,
  rows = 3,
  className,
  inputClassName,
  onClick,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  inputClassName?: string;
  onClick?: (event: MouseEvent) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing && !disabled) {
    if (multiline) {
      return (
        <Textarea
          autoFocus
          value={value}
          disabled={disabled}
          rows={rows}
          placeholder={placeholder}
          className={cn(
            "min-h-18 w-full resize-y whitespace-pre-wrap border border-input px-3 py-2",
            className,
            inputClassName,
          )}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setEditing(false)}
          onClick={onClick}
        />
      );
    }

    return (
      <Input
        autoFocus
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "h-8 min-h-8 border border-input bg-transparent px-0 py-1.5 shadow-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
          inputClassName,
        )}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        onClick={onClick}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!disabled) {
          setEditing(true);
        }
      }}
      className={cn(
        "w-full rounded-none border border-input bg-transparent text-left transition-colors",
        "hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-70",
        multiline ? "min-h-18 px-3 py-2" : "min-h-8 px-0 py-1.5",
        className,
      )}
    >
      {value.trim() ? (
        <MathText
          text={value}
          className={cn(
            multiline
              ? "text-sm leading-6 md:text-base"
              : "text-sm leading-6",
          )}
        />
      ) : (
        <span className="text-sm text-muted-foreground">
          {placeholder ?? "Click to edit"}
        </span>
      )}
    </button>
  );
}
