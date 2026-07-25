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

export type LikeFeedItem = Like & {
  attributedUserName: string | null;
};

export type LikesPage = {
  items: LikeFeedItem[];
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

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type MeResponse = {
  user: AuthUser | null;
};
