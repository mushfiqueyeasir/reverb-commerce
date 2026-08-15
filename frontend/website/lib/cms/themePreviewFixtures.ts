import {
  KAWAII_FASHION_PREVIEW_DATA,
  KAWAII_FASHION_PREVIEW_SECTIONS,
} from "./kawaiiFashionThemePreviewFixture";
import {
  TEE_DROP_PREVIEW_DATA,
  TEE_DROP_PREVIEW_SECTIONS,
} from "./themePreviewFixture";

export const THEME_PREVIEW_FIXTURES = {
  "tee-drop": {
    data: TEE_DROP_PREVIEW_DATA,
    sections: TEE_DROP_PREVIEW_SECTIONS,
  },
  "kawaii-fashion": {
    data: KAWAII_FASHION_PREVIEW_DATA,
    sections: KAWAII_FASHION_PREVIEW_SECTIONS,
  },
} as const;

export type ThemePreviewFixtureId = keyof typeof THEME_PREVIEW_FIXTURES;