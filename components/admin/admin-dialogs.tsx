"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmRequest {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  /** Red button for deletes and other actions that cannot be undone. */
  destructive?: boolean;
  onConfirm: () => void;
}

/** Asks before an action that deletes something or changes what visitors see. */
export function ConfirmDialog({
  request,
  pending,
  onCancel,
}: {
  request: ConfirmRequest | null;
  pending?: boolean;
  onCancel: () => void;
}) {
  // Keep the last request on screen while the dialog animates closed.
  const [last, setLast] = useState<ConfirmRequest | null>(request);
  if (request && request !== last) setLast(request);
  const shown = request ?? last;

  return (
    <AlertDialog open={request !== null} onOpenChange={(open) => !open && !pending && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{shown?.title}</AlertDialogTitle>
          <AlertDialogDescription>{shown?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() => request?.onConfirm()}
            className={shown?.destructive ? "bg-red-600 text-white hover:bg-red-700" : undefined}
          >
            {pending ? "Working…" : shown?.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export interface NameRequest {
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
}

function NameForm({
  request,
  pending,
  onCancel,
}: {
  request: NameRequest;
  pending?: boolean;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(request.initialValue ?? "");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const name = value.trim();
    if (!name) {
      setError(`${request.label} is required.`);
      return;
    }
    request.onSubmit(name);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{request.title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="name-dialog-input">{request.label}</Label>
        <Input
          id="name-dialog-input"
          autoFocus
          value={value}
          placeholder={request.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "name-dialog-error" : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
        />
        {error ? (
          <p id="name-dialog-error" role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : request.submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Asks for a single name, in place of the browser's own prompt box. */
export function NameDialog({
  request,
  pending,
  onCancel,
}: {
  request: NameRequest | null;
  pending?: boolean;
  onCancel: () => void;
}) {
  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && !pending && onCancel()}>
      <DialogContent showCloseButton={false}>
        {request ? <NameForm request={request} pending={pending} onCancel={onCancel} /> : null}
      </DialogContent>
    </Dialog>
  );
}
