import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "pending" | "processing" | "done" | "admin" | "user";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  admin: "bg-purple-100 text-purple-800",
  user: "bg-gray-100 text-gray-700",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Helper to get the correct badge variant for a task status.
 */
export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "PENDING"
      ? "pending"
      : status === "PROCESSING"
        ? "processing"
        : "done";

  return <Badge variant={variant}>{status}</Badge>;
}
