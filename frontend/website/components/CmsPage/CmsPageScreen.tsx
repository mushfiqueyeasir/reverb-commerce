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
        className="mt-8 max-w-none overflow-x-auto text-base leading-7 text-foreground/80 lg:text-lg lg:leading-8 [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2+*]:mt-0 [&_h2]:my-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-7 [&_h2]:text-foreground lg:[&_h2]:text-3xl lg:[&_h2]:leading-10 [&_h3+*]:mt-0 [&_h3]:my-3 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground lg:[&_h3]:text-2xl [&_hr+*]:mt-0 [&_hr]:my-12 [&_hr]:border-border lg:[&_hr]:my-14 [&_img]:max-w-full [&_li]:my-2 [&_li]:pl-1.5 lg:[&_li]:my-3 lg:[&_li]:pl-2 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-7 lg:[&_ol]:my-6 lg:[&_ol]:pl-8 [&_p]:my-5 lg:[&_p]:my-6 [&_strong]:font-semibold [&_strong]:text-foreground [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-7 lg:[&_ul]:my-6 lg:[&_ul]:pl-8"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </section>
  );
}
