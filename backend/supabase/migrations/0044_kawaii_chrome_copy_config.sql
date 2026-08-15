with defaults as (
  select
    jsonb_build_object(
      'primaryNavigationAriaLabel', 'Primary navigation',
      'desktopSearchAriaLabel', 'Search products',
      'desktopFavoritesAriaLabel', 'Favorites',
      'desktopBagAriaLabel', 'Shopping bag',
      'homeLinkAriaLabelTemplate', '{storeName} home',
      'shopAllTemplate', 'Shop all {label}',
      'collectionsCountTemplate', '{count} collections',
      'mobileNavigationAriaLabel', 'Mobile shopping navigation',
      'mobileHomeLabel', 'Home',
      'mobileSavedLabel', 'Saved',
      'mobileShopLabel', 'Shop',
      'mobileBagLabel', 'Bag',
      'mobileSearchLabel', 'Search',
      'mobileSearchAriaLabel', 'Search products',
      'countOverflowLabel', '9+',
      'collectionsLabel', 'Collections',
      'shopByCategoryLabel', 'Shop by category',
      'primaryCategoryLabel', 'Primary category',
      'exploreLabel', 'Explore',
      'emptyCollectionLabel', 'Explore all products in this collection.',
      'compactMenuTitle', 'Shop categories',
      'compactMenuDescription', 'Find your collection.'
    ) as navbar_copy,
    jsonb_build_object(
      'addFavoriteAriaLabel', 'Add to favorites',
      'removeFavoriteAriaLabel', 'Remove from favorites',
      'favoriteSavedToast', 'Saved to favorites',
      'favoriteRemovedToast', 'Removed from favorites',
      'soldOutButtonLabel', 'Sold Out',
      'quickAddButtonLabel', 'Quick Add'
    ) as product_card_copy,
    jsonb_build_object(
      'homeLinkAriaLabelTemplate', '{storeName} home',
      'copyrightTemplate', '© {year} {storeName}',
      'facebookAriaLabel', 'Facebook',
      'instagramAriaLabel', 'Instagram',
      'twitterAriaLabel', 'X',
      'youtubeAriaLabel', 'YouTube'
    ) as footer_copy
), source as (
  select
    settings.id,
    case
      when jsonb_typeof(settings.socials) = 'object' then settings.socials
      else '{}'::jsonb
    end as socials,
    case
      when jsonb_typeof(settings.socials -> '_cms') = 'object' then settings.socials -> '_cms'
      else '{}'::jsonb
    end as cms,
    case
      when jsonb_typeof(settings.socials #> '{_cms,navbar}') = 'object' then settings.socials #> '{_cms,navbar}'
      else '{}'::jsonb
    end as navbar,
    case
      when jsonb_typeof(settings.socials #> '{_cms,navbar,copy}') = 'object' then settings.socials #> '{_cms,navbar,copy}'
      else '{}'::jsonb
    end as navbar_copy,
    case
      when jsonb_typeof(settings.socials #> '{_cms,navbar,productCardCopy}') = 'object' then settings.socials #> '{_cms,navbar,productCardCopy}'
      else '{}'::jsonb
    end as product_card_copy,
    case
      when jsonb_typeof(settings.socials #> '{_cms,footer}') = 'object' then settings.socials #> '{_cms,footer}'
      else '{}'::jsonb
    end as footer,
    case
      when jsonb_typeof(settings.socials #> '{_cms,footer,copy}') = 'object' then settings.socials #> '{_cms,footer,copy}'
      else '{}'::jsonb
    end as footer_copy
  from public.site_settings settings
)
update public.site_settings settings
set socials = jsonb_set(
  jsonb_set(
    jsonb_set(source.socials, '{_cms}', source.cms, true),
    '{_cms,navbar}',
    source.navbar || jsonb_build_object(
      'copy', defaults.navbar_copy || source.navbar_copy,
      'productCardCopy', defaults.product_card_copy || source.product_card_copy
    ),
    true
  ),
  '{_cms,footer}',
  source.footer || jsonb_build_object(
    'copy', defaults.footer_copy || source.footer_copy
  ),
  true
)
from source, defaults
where settings.id = source.id
  and (
    source.navbar_copy <> (defaults.navbar_copy || source.navbar_copy)
    or source.product_card_copy <> (defaults.product_card_copy || source.product_card_copy)
    or source.footer_copy <> (defaults.footer_copy || source.footer_copy)
  );
