"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

export function BackToDashboardButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={() => router.push("/home")}
    >
      <LayoutDashboard className="h-4 w-4" />
      Ir a mi panel
    </Button>
  );
}
