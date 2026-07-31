export type HealthStatus = {
  status: "ok";
};

export type CreateLikeRequest = {
  story?: string;
  hoursSaved?: number;
  awardIds?: string[];
};

export type AwardSummary = {
  id: string;
  title: string;
  icon: string | null;
};

export type Like = {
  id: string;
  createdAt: string;
  story: string | null;
  hoursSaved: number | null;
  awards: AwardSummary[];
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

export type Award = {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  icon: string | null;
  givenCount: number;
};

export type CreateAwardRequest = {
  title: string;
  description: string;
  icon?: string;
};

export type UpdateAwardRequest = {
  title?: string;
  description?: string;
  icon?: string;
};
