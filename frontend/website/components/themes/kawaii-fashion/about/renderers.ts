import KawaiiAboutCraft from "./KawaiiAboutCraft";
import KawaiiAboutCta from "./KawaiiAboutCta";
import KawaiiAboutHero from "./KawaiiAboutHero";
import KawaiiAboutStats from "./KawaiiAboutStats";
import KawaiiAboutStory from "./KawaiiAboutStory";
import KawaiiAboutValues from "./KawaiiAboutValues";
import type { AboutRendererRegistry } from "@/lib/cms/aboutRendererRegistry";
import { KAWAII_FASHION_ABOUT_RENDERER_PATHS } from "@/lib/cms/aboutRendererRegistry";
import type { AboutSectionRenderer } from "@/components/themes/types";

export const KAWAII_FASHION_ABOUT_RENDERERS: Partial<
  AboutRendererRegistry<AboutSectionRenderer>
> = {
  [KAWAII_FASHION_ABOUT_RENDERER_PATHS.hero]: KawaiiAboutHero,
  [KAWAII_FASHION_ABOUT_RENDERER_PATHS.stats]: KawaiiAboutStats,
  [KAWAII_FASHION_ABOUT_RENDERER_PATHS.story]: KawaiiAboutStory,
  [KAWAII_FASHION_ABOUT_RENDERER_PATHS.values]: KawaiiAboutValues,
  [KAWAII_FASHION_ABOUT_RENDERER_PATHS.craft]: KawaiiAboutCraft,
  [KAWAII_FASHION_ABOUT_RENDERER_PATHS.cta]: KawaiiAboutCta,
};