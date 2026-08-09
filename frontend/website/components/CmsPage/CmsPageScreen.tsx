interface CmsPageScreenProps {
  eyebrow?: string;
  title: string;
  bodyHtml: string;
}

export default function CmsPageScreen({
  eyebrow = "Store",
  title,
  bodyHtml,
}: CmsPageScreenProps) {
  return (
    <section className="mx-auto max-w-3xl px-5 pb-24 pt-24 sm:px-6 md:px-10 md:pt-36">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h1>
      <div
        className="prose prose-invert mt-8 max-w-none overflow-x-auto text-muted-foreground prose-headings:font-display prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-img:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </section>
  );
}
