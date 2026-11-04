"use client";

import { useEffect } from "react";

const LOCK_CLASS = "kiosk-lock-select";

function isTextField(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function isEditable(target: EventTarget | null) {
  return (
    isTextField(target) ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/**
 * Kiosk lockdown for the whole document, including dialogs and the keyboard that render
 * outside the kiosk frame: no text highlighting, copying, context menu, or dragging.
 * Typing still works; any selection inside a field is collapsed to the caret.
 */
export function KioskSelectionLock() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(LOCK_CLASS);

    const block = (event: Event) => event.preventDefault();

    const onSelectStart = (event: Event) => {
      if (!isEditable(event.target)) event.preventDefault();
    };

    const collapseField = (field: HTMLInputElement | HTMLTextAreaElement) => {
      try {
        const end = field.selectionEnd;
        if (end != null && field.selectionStart !== end) field.setSelectionRange(end, end);
      } catch {
        // Some input types (email, number) have no selection API; they are hidden by CSS.
      }
    };

    const onFieldSelect = (event: Event) => {
      if (isTextField(event.target)) collapseField(event.target);
    };

    const onSelectionChange = () => {
      const active = document.activeElement;
      if (isTextField(active)) {
        collapseField(active);
        return;
      }
      const selection = document.getSelection();
      if (selection && !selection.isCollapsed) selection.removeAllRanges();
    };

    document.addEventListener("selectstart", onSelectStart, true);
    document.addEventListener("select", onFieldSelect, true);
    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("contextmenu", block, true);
    document.addEventListener("dragstart", block, true);
    document.addEventListener("copy", block, true);
    document.addEventListener("cut", block, true);

    return () => {
      root.classList.remove(LOCK_CLASS);
      document.removeEventListener("selectstart", onSelectStart, true);
      document.removeEventListener("select", onFieldSelect, true);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("contextmenu", block, true);
      document.removeEventListener("dragstart", block, true);
      document.removeEventListener("copy", block, true);
      document.removeEventListener("cut", block, true);
    };
  }, []);

  return null;
}
