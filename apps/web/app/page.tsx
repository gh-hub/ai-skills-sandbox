"use client";

import { useEffect, useState } from "react";
import type { CreateLikeRequest, LikeCount } from "@thanks-claude/shared-types";

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [story, setStory] = useState("");
  const [hoursSaved, setHoursSaved] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    try {
      const res = await fetch("/api/likes/count");
      if (!res.ok) throw new Error("Failed to load like count");
      const data: LikeCount = await res.json();
      setCount(data.count);
      setError(null);
    } catch {
      setError("Couldn't load the like count. Please refresh the page.");
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  const submitLike = async (body: CreateLikeRequest) => {
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Failed to submit like");
  };

  const handleLikeClick = async () => {
    try {
      await submitLike({});
      await fetchCount();
    } catch {
      setError("Couldn't record your like. Please try again.");
    }
  };

  const handleStorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedStory = story.trim();
    const trimmedHours = hoursSaved.trim();

    try {
      await submitLike({
        story: trimmedStory === "" ? undefined : trimmedStory,
        hoursSaved: trimmedHours === "" ? undefined : Number(trimmedHours),
      });
      setStory("");
      setHoursSaved("");
      setIsExpanded(false);
      await fetchCount();
    } catch {
      setError("Couldn't submit your story. Please try again.");
    }
  };

  return (
    <main>
      <h1>Thanks, Claude</h1>

      {error && <p role="alert">{error}</p>}

      <p>
        <button onClick={handleLikeClick}>Like</button>{" "}
        {count === null ? "loading…" : `${count} likes`}
      </p>

      <button onClick={() => setIsExpanded((prev) => !prev)}>
        {isExpanded ? "Hide story" : "Share a story"}
      </button>

      {isExpanded && (
        <form onSubmit={handleStorySubmit}>
          <div>
            <label htmlFor="story">Story (optional)</label>
            <br />
            <textarea
              id="story"
              value={story}
              onChange={(event) => setStory(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="hoursSaved">Hours saved (optional)</label>
            <br />
            <input
              id="hoursSaved"
              type="number"
              value={hoursSaved}
              onChange={(event) => setHoursSaved(event.target.value)}
            />
          </div>
          <button type="submit">Submit</button>
        </form>
      )}
    </main>
  );
}
