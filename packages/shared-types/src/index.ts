export type HealthStatus = {
  status: "ok";
};

export type CreateLikeRequest = {
  story?: string;
  hoursSaved?: number;
};

export type Like = {
  id: string;
  createdAt: string;
  story: string | null;
  hoursSaved: number | null;
};

export type LikeCount = {
  count: number;
};

export type LikesPage = {
  items: Like[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type LikesStats = {
  totalLikes: number;
  likesWithHoursReported: number;
  reportedHoursSaved: number;
  percentWithoutHoursReported: number;
  averageHoursPerReport: number;
  estimatedTotalHoursSaved: number;
};
