export interface KawaiiAboutRendererProps {
  config: Record<string, unknown>;
  imageUrl?: string | null;
  preview?: boolean;
  headingLevel?: "h1" | "h2";
}
