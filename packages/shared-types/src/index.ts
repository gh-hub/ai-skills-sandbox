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
