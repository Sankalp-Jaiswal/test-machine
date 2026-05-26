// components/PracticeWizard/ReviewTile.tsx
"use client";

import React from "react";

interface Props {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ReviewTile({ label, value, icon: Icon }: Props) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-secondary/20 border border-border/30">
      <Icon className="w-4 h-4 text-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="font-medium text-foreground text-sm">{value}</span>
      </div>
    </div>
  );
}
