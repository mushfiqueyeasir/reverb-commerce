"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
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
import { updateUser } from "./actions";
import type { UserTableRow } from "./UsersTable";

const ROLES: UserRole[] = ["admin", "editor", "viewer"];

export function EditUserDialog({
  user,
  isSelf,
}: {
  user: UserTableRow;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [role, setRole] = useState<UserRole>(user.role);

  useEffect(() => {
    if (!open) return;
    setEmail(user.email === "—" ? "" : user.email);
    setPassword("");
    setFullName(user.full_name ?? "");
    setRole(user.role);
  }, [open, user]);

  const onSubmit = () => {
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (password && password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    startTransition(async () => {
      const res = await updateUser({
        userId: user.id,
        email,
        fullName,
        role,
        password: password.trim() || undefined,
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("User updated");
      setPassword("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Edit user"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display">Edit user</DialogTitle>
          <DialogDescription>
            Update account details
            {isSelf ? ". You cannot change your own role." : " and role."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <FormField label="Email" htmlFor={`edit_email_${user.id}`}>
            <Input
              id={`edit_email_${user.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@store.example"
              className={adminInputClass}
            />
          </FormField>
          <FormField
            label="New password"
            htmlFor={`edit_password_${user.id}`}
            hint="Leave blank to keep the current password."
          >
            <Input
              id={`edit_password_${user.id}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={adminInputClass}
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Full name" htmlFor={`edit_name_${user.id}`}>
            <Input
              id={`edit_name_${user.id}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className={adminInputClass}
            />
          </FormField>
          <FormField label="Role">
            <Select
              value={role}
              onValueChange={(v) => setRole(v as UserRole)}
              disabled={isSelf}
            >
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
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
