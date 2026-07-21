import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubredditFilter({ subreddits, selectedSubreddits, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter subreddits by search query
  const filtered = useMemo(() => {
    if (!search.trim()) {
      return subreddits;
    }

    const query = search.toLowerCase();
    return subreddits.filter((subreddit) => subreddit.name.toLowerCase().includes(query));
  }, [subreddits, search]);

  function handleSelect(name) {
    if (selectedSubreddits.includes(name)) {
      onChange(selectedSubreddits.filter((subreddit) => subreddit !== name));
    } else {
      onChange([...selectedSubreddits, name]);
    }
  }

  return (
    <div className="w-full space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal text-muted-foreground"
          >
            {selectedSubreddits.length > 0
              ? `${selectedSubreddits.length} subreddits selected`
              : "Filter by subreddit..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 overflow-hidden"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search input */}
          <div className="flex items-center border-b">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subreddits..."
              className="h-10 border-0 shadow-none focus-visible:ring-0 px-3"
            />
          </div>

          {/* Count hint */}
          <p className="px-3 py-1.5 text-xs text-muted-foreground border-b">
            {filtered.length === 0 ? "No results" : `${filtered.length} subreddits`}
          </p>

          {/* Subreddit list with counts */}
          <div className="max-h-[280px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No subreddits found.</p>
            ) : (
              filtered.map(({ name, count }) => {
                const selected = selectedSubreddits.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => handleSelect(name)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      selected && "text-foreground font-medium",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Check className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                      <span>r/{name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{count.toLocaleString()}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {selectedSubreddits.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {selectedSubreddits.map((sub) => {
            const subredditData = subreddits.find((s) => s.name === sub);
            const count = subredditData?.count || 0;

            return (
              <Badge key={sub} variant="secondary" className="gap-1 pr-1">
                r/{sub} <span className="text-muted-foreground">({count.toLocaleString()})</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                  onClick={() => onChange(selectedSubreddits.filter((s) => s !== sub))}
                >
                  <X size={12} />
                </Button>
              </Badge>
            );
          })}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground"
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
