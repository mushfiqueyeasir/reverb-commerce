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
  suggestedReplies: string[];
  recommendations: AiAdvisorRecommendation[];
}
