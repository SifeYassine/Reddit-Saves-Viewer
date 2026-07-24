import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronsLeft, ChevronsRight, ArrowRight } from "lucide-react";
import {
  Pagination as PaginationContainer,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function Pagination({ currentPage, totalPages, onPageChange, isLoading }) {
  const [pageInput, setPageInput] = useState("");

  const canGoPrevious = currentPage > 1 && !isLoading;
  const canGoNext = currentPage < totalPages && !isLoading;

  function navigate(page) {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePageJump() {
    const page = parseInt(pageInput);

    if (page < 1 || page > totalPages) {
      setPageInput("");
      return;
    }

    navigate(page);
    setPageInput("");
  }

  function handleKeyPress(event) {
    if (event.key === "Enter") {
      handlePageJump();
    }
  }

  if (totalPages === 0) return null;

  return (
    <PaginationContainer className="py-8">
      <div className="flex flex-col items-center gap-4">
        {/* First page button */}
        <PaginationContent className="flex-wrap gap-2 justify-center">
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(1)}
              disabled={currentPage === 1 || isLoading}
              className="hidden sm:inline-flex"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {/* Previous page button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => canGoPrevious && navigate(currentPage - 1)}
              aria-disabled={!canGoPrevious}
              className={!canGoPrevious ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {/* Current page indicator */}
          <PaginationItem>
            <span className="text-sm font-medium px-4 text-muted-foreground whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
          </PaginationItem>

          {/* Next page button */}
          <PaginationItem>
            <PaginationNext
              onClick={() => canGoNext && navigate(currentPage + 1)}
              aria-disabled={!canGoNext}
              className={!canGoNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {/* Last page button */}
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="hidden sm:inline-flex"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>

        {/* Jump to page input */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium">Jump to:</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`1-${totalPages}`}
            disabled={isLoading}
            className="w-20 h-9"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePageJump}
            disabled={!pageInput || isLoading}
            className="gap-1"
          >
            Go
          </Button>
        </div>
      </div>
    </PaginationContainer>
  );
}
