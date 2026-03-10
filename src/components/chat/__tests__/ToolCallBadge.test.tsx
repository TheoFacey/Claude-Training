import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { getToolCallLabel, ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

describe("getToolCallLabel", () => {
  describe("str_replace_editor", () => {
    it("create with path returns Creating {filename}", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "create", path: "src/components/Card.tsx" })).toBe("Creating Card.tsx");
    });

    it("str_replace with path returns Editing {filename}", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "src/App.tsx" })).toBe("Editing App.tsx");
    });

    it("insert with path returns Editing {filename}", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "src/App.tsx" })).toBe("Editing App.tsx");
    });

    it("view with path returns Reading {filename}", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "view", path: "src/index.tsx" })).toBe("Reading index.tsx");
    });

    it("undo_edit with path returns Undoing edit in {filename}", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "src/Button.tsx" })).toBe("Undoing edit in Button.tsx");
    });

    it("create with empty path returns generic fallback", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "create", path: "" })).toBe("Creating file");
    });

    it("str_replace with empty path returns generic fallback", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "" })).toBe("Editing file");
    });

    it("insert with empty path returns generic fallback", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "" })).toBe("Editing file");
    });

    it("view with empty path returns generic fallback", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "view", path: "" })).toBe("Reading file");
    });

    it("undo_edit with empty path returns generic fallback", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "" })).toBe("Undoing edit");
    });

    it("unknown command returns str_replace_editor fallback", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "unknown", path: "App.tsx" })).toBe("str_replace_editor");
    });

    it("path with no directory separator uses full path as filename", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "create", path: "App.tsx" })).toBe("Creating App.tsx");
    });
  });

  describe("file_manager", () => {
    it("rename with path returns Renaming {filename}", () => {
      expect(getToolCallLabel("file_manager", { command: "rename", path: "src/Old.tsx" })).toBe("Renaming Old.tsx");
    });

    it("delete with path returns Deleting {filename}", () => {
      expect(getToolCallLabel("file_manager", { command: "delete", path: "src/Unused.tsx" })).toBe("Deleting Unused.tsx");
    });

    it("rename with empty path returns generic fallback", () => {
      expect(getToolCallLabel("file_manager", { command: "rename", path: "" })).toBe("Renaming file");
    });

    it("delete with empty path returns generic fallback", () => {
      expect(getToolCallLabel("file_manager", { command: "delete", path: "" })).toBe("Deleting file");
    });
  });

  describe("edge cases", () => {
    it("unknown toolName returns raw toolName", () => {
      expect(getToolCallLabel("some_other_tool", {})).toBe("some_other_tool");
    });

    it("missing path key returns generic fallback", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
    });

    it("non-string path returns generic fallback", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "create", path: 42 })).toBe("Creating file");
    });
  });
});

describe("ToolCallBadge", () => {
  afterEach(cleanup);

  function makeInvocation(overrides: Partial<ToolInvocation>): ToolInvocation {
    return {
      toolCallId: "call-1",
      toolName: "str_replace_editor",
      args: { command: "create", path: "src/Card.tsx" },
      state: "call",
      ...overrides,
    } as ToolInvocation;
  }

  it("state=call renders spinner and human-friendly label", () => {
    const { container } = render(<ToolCallBadge toolInvocation={makeInvocation({ state: "call" })} />);
    expect(within(container).getByText("Creating Card.tsx")).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("state=result with non-null result renders green dot and label", () => {
    const { container } = render(
      <ToolCallBadge
        toolInvocation={makeInvocation({ state: "result", result: "ok" } as ToolInvocation)}
      />
    );
    expect(within(container).getByText("Creating Card.tsx")).toBeTruthy();
    expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  });

  it("state=result with null result renders spinner (not completed)", () => {
    const { container } = render(
      <ToolCallBadge
        toolInvocation={makeInvocation({ state: "result", result: null } as ToolInvocation)}
      />
    );
    expect(container.querySelector(".bg-emerald-500")).toBeNull();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("state=partial-call renders spinner", () => {
    const { container } = render(<ToolCallBadge toolInvocation={makeInvocation({ state: "partial-call" })} />);
    expect(container.querySelector(".bg-emerald-500")).toBeNull();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("empty args renders raw toolName as fallback label", () => {
    const { container } = render(
      <ToolCallBadge
        toolInvocation={makeInvocation({ toolName: "my_tool", args: {} })}
      />
    );
    expect(within(container).getByText("my_tool")).toBeTruthy();
  });

  it("badge div does not have font-mono class", () => {
    const { container } = render(<ToolCallBadge toolInvocation={makeInvocation({})} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).not.toContain("font-mono");
  });
});
