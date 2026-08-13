import assert from "node:assert/strict";
import test from "node:test";
import { Readable } from "node:stream";
import {
  buildReviewRows,
  parseReviewsExport,
  reviewImageFor,
  reviewInsertSql,
  selectReviews,
} from "./import-kawaii-reviews.mjs";
import { csvRows } from "./import-kawaii-products.mjs";

const COMMENTS_HEADER =
  "comment_ID,comment_post_ID,comment_author,comment_author_email,comment_author_url,comment_author_IP,comment_date,comment_date_gmt,comment_content,comment_karma,comment_approved,comment_agent,comment_type,comment_parent,user_id";
const COMMENTMETA_HEADER = "meta_id,comment_id,meta_key,meta_value";

function exportFixture() {
  const rows = [
    `"action_id","hook"`,
    `"1","x"`,
    COMMENTMETA_HEADER,
    `"1","101","rating","5"`,
    `"2","102","rating","3"`,
    `"3","103","rating","4"`,
    COMMENTS_HEADER,
    `"101","200","Shairy",,,,"2023-08-01 04:40:23","2023-08-01 04:40:23","<p>Great product &amp; fast delivery</p>","0","1","","review","0","0"`,
    `"102","201","Alex",,,,"2023-08-02 04:40:23","2023-08-02 04:40:23","Mediocre.","0","1","","review","0","0"`,
    `"103","202","Pia",,,,"2023-08-03 04:40:23","2023-08-03 04:40:23","","0","1","","review","0","0"`,
    `"104","203","Spam",,,,"2023-08-04 04:40:23","2023-08-04 04:40:23","Unapproved","0","0","","review","0","0"`,
    `"105","204","Note",,,,"2023-08-05 04:40:23","2023-08-05 04:40:23","Order note","0","1","","order_note","0","0"`,
  ];
  return Readable.from(rows.map((row) => `${row}\r\n`));
}

test("parseReviewsExport only keeps approved review comments", async () => {
  const parsed = await parseReviewsExport(
    "/virtual/export.csv",
    exportFixture(),
  );
  assert.equal(parsed.comments.length, 3);
  assert.deepEqual(
    parsed.comments.map((comment) => comment.id),
    ["101", "102", "103"],
  );
  assert.equal(parsed.comments[0].author, "Shairy");
  assert.equal(parsed.comments[0].content, "Great product & fast delivery");
  assert.equal(parsed.ratings.get("101"), "5");
});

test("selectReviews picks highest-rated with bodies and caps at limit", () => {
  const parsed = {
    comments: [
      {
        id: "101",
        author: "A",
        content: "Great",
        createdAt: "2023-01-01T00:00:00.000Z",
      },
      {
        id: "102",
        author: "B",
        content: "",
        createdAt: "2023-01-02T00:00:00.000Z",
      },
      {
        id: "103",
        author: "C",
        content: "Fine",
        createdAt: "2023-01-03T00:00:00.000Z",
      },
    ],
    ratings: new Map([
      ["101", "5"],
      ["102", "5"],
      ["103", "4"],
    ]),
  };
  const selected = selectReviews(parsed, 2);
  assert.equal(selected.length, 2);
  assert.deepEqual(
    selected.map((review) => review.id),
    ["101", "102"],
  );
  assert.equal(selected[0].image_path, "kawaii-reviews/v1/review-01.png");
});

test("buildReviewRows flattens reviews without a product link", () => {
  const rows = buildReviewRows([
    {
      author: "Shairy",
      content: "Great",
      rating: 5,
      image_path: "kawaii-reviews/v1/review-01.png",
      createdAt: "2023-01-01T00:00:00.000Z",
    },
  ]);
  assert.deepEqual(rows, [
    {
      customer_name: "Shairy",
      image_path: "kawaii-reviews/v1/review-01.png",
      rating: 5,
      body: "Great",
      product_id: null,
      is_published: true,
      created_at: "2023-01-01T00:00:00.000Z",
    },
  ]);
});

test("reviewInsertSql is locked and scoped to published reviews", () => {
  const sql = reviewInsertSql([{ customer_name: "Shairy" }]);
  assert.match(
    sql,
    /pg_advisory_xact_lock\(hashtext\('kawaii-review-import-v1'\)\)/,
  );
  assert.match(sql, /insert into public\.reviews/);
  assert.match(sql, /product_id uuid/);
});

test("csvRows still parses multiline fields", async () => {
  const rows = [];
  for await (const row of csvRows(exportFixture())) rows.push(row);
  assert.equal(rows.length, 12);
});

test("reviewImageFor picks a matching keyword image and falls back per slot", () => {
  const acneUrl = reviewImageFor("Really great for acne so far!", 0);
  assert.match(acneUrl, /^https:\/\/images\.unsplash\.com\/photo-/);
  assert.match(acneUrl, /w=900&h=1100/);
  assert.notEqual(acneUrl, reviewImageFor("no keyword here", 1));
  const first = reviewImageFor("generic", 0);
  const second = reviewImageFor("generic", 1);
  assert.notEqual(first, second);
});
