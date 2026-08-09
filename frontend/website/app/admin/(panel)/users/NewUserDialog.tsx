"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  adminInputClass,
  adminSelectClass,
} from "@/components/admin/FormField";
import type { UserRole } from "@/type/db";
import { createUser } from "./actions";

const ROLES: UserRole[] = ["admin", "editor", "viewer"];

export function NewUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");

  const reset = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("viewer");
  };

  const onSubmit = () => {
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    startTransition(async () => {
      const res = await createUser({ email, password, fullName, role });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("User created");
      reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <UserPlus className="mr-2 size-4" />
          New user
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display">Create user</DialogTitle>
          <DialogDescription>
            Add a new staff member and assign their role.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <FormField label="Email" htmlFor="new_email">
            <Input
              id="new_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@store.example"
              className={adminInputClass}
            />
          </FormField>
          <FormField label="Password" htmlFor="new_password">
            <Input
              id="new_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={adminInputClass}
            />
          </FormField>
          <FormField label="Full name" htmlFor="new_name">
            <Input
              id="new_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className={adminInputClass}
            />
          </FormField>
          <FormField label="Role">
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className={adminSelectClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={pending}
            className="rounded-full"
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
