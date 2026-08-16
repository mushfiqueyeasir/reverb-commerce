export const AI_ADVISOR_USER_MESSAGE_MAX_LENGTH = 1_000;

export interface AiAdvisorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiAdvisorProduct {
  id: string;
  title: string;
  href: string;
  image: string;
  currentPrice: number;
  originalPrice: number;
}

export interface AiAdvisorRecommendation {
  product: AiAdvisorProduct;
  reason: string;
}

export interface AiAdvisorResponse {
  message: string;
  status: "answer" | "clarifying" | "recommendations" | "no_match";
  recommendations: AiAdvisorRecommendation[];
}
