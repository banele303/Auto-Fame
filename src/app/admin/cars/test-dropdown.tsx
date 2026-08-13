"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function TestDropdown() {
  return (
    <div className="p-8">
      <h1>Test Dropdown Menu</h1>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" className="h-8 w-8 p-0">
            <div>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border">
            <DropdownMenuItem onClick={() => alert("Edit clicked!")}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert("Delete clicked!")}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  );
}
