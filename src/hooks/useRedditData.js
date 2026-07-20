import { useState, useEffect, useMemo } from "react";
import { loadCSVFile } from "@/lib/loadCSV";
import Fuse from "fuse.js";
import axios from "axios";

export function useRedditData() {
  const [allRows, setAllRows] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubreddits, setSelectedSubreddits] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;

  // Load CSV on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const rows = await loadCSVFile("/db.csv");
        setAllRows(rows);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading CSV:", err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Fuzzy search config
  const fuse = useMemo(() => {
    if (allRows.length === 0) {
      return null;
    }

    return new Fuse(allRows, {
      keys: ["title"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [allRows]);

  // Filter and search rows
  const filteredRows = useMemo(() => {
    let result = allRows;

    if (searchQuery.trim() && fuse) {
      result = fuse.search(searchQuery).map((rslt) => rslt.item);
    }

    if (selectedSubreddits.length > 0) {
      const subredditSet = new Set(selectedSubreddits);
      result = result.filter((row) => subredditSet.has(row.subreddit));
    }

    return result;
  }, [allRows, selectedSubreddits, searchQuery, fuse]);

  // Get unique subreddits with post counts
  const subreddits = useMemo(() => {
    const counts = new Map();

    allRows.forEach(({ subreddit }) => {
      if (!subreddit) {
        return;
      }

      counts.set(subreddit, (counts.get(subreddit) || 0) + 1);
    });

    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allRows]);

  // Paginate filtered rows
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    return filteredRows.slice(startIndex, startIndex + postsPerPage);
  }, [filteredRows, currentPage, postsPerPage]);

  const totalPages = Math.ceil(filteredRows.length / postsPerPage);

  // Fetch Reddit posts from server (with SQLite caching)
  useEffect(() => {
    async function fetchPosts() {
      if (paginatedRows.length === 0) {
        setPosts([]);
        return;
      }

      setIsLoadingPosts(true);

      try {
        const urls = paginatedRows.map((row) => row.url);
        const response = await axios.post("http://localhost:3000/api/fetch-posts", { urls });
        setPosts(response.data.posts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setIsLoadingPosts(false);
      }
    }

    fetchPosts();
  }, [paginatedRows]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSubreddits]);

  return {
    posts,
    isLoading: isLoading || isLoadingPosts,
    isLoadingPosts,
    error,
    searchQuery,
    setSearchQuery,
    selectedSubreddits,
    setSelectedSubreddits,
    subreddits,
    currentPage,
    setCurrentPage,
    totalPages,
    totalPosts: filteredRows.length,
    allPostsCount: allRows.length,
  };
}
