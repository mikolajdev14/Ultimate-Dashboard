import { Plus } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Section({
  id,
  title,
  subtitle,
  action,
  onAction,
  children,
  className,
  headerExtra,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
  headerExtra?: React.ReactNode;
}) {
  return (
    <Card id={id} className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {subtitle ? (
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {headerExtra}
          {action && onAction ? (
            <Button onClick={onAction}>
              <Plus className="mr-2 size-4" />
              {action}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 sm:mt-5">{children}</div>
    </Card>
  );
}
