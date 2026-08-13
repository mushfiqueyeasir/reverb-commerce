import { describe, expect, it } from "vitest";
import { isPublicManagedSlug } from "../cms/managedPages";
import { sanitizeCmsHtml } from "./sanitize";

describe("sanitizeCmsHtml", () => {
  it("removes executable markup and unsafe protocols", () => {
    const html = sanitizeCmsHtml(
      '<script>alert(1)</script><img src="https://example.com/a.png" onerror=alert(1)><a href="jav&#x61;script:alert(1)">Bad</a><p>Safe</p>',
    );
    expect(html).not.toMatch(/script|onerror|javascript|alert\(1\)/i);
    expect(html).toContain('<img src="https://example.com/a.png" />');
    expect(html).toContain("<p>Safe</p>");
  });

  it("adds isolation to links that open a new tab", () => {
    expect(
      sanitizeCmsHtml('<a href="https://example.com" target="_blank">Link</a>'),
    ).toContain('rel="noopener noreferrer"');
  });
});

describe("isPublicManagedSlug", () => {
  it("accepts imported pages and rejects reserved routes", () => {
    expect(isPublicManagedSlug("faqs")).toBe(true);
    expect(isPublicManagedSlug("pre-order")).toBe(true);
    expect(isPublicManagedSlug("terms")).toBe(false);
    expect(isPublicManagedSlug("../admin")).toBe(false);
  });
});
