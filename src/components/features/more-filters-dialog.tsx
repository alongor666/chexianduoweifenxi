"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FilterPanel } from "@/components/filters/filter-panel";

export function MoreFiltersDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 border-slate-300 hover:border-slate-400"
      >
        <Filter className="w-4 h-4" />
        更多筛选
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              更多筛选
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              精细筛选业务数据，快速定位目标信息
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <FilterPanel />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
