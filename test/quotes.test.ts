import { describe, expect, it } from "vitest";
import { quoteLibrary, selectQuoteCandidates } from "../src/quotes";

describe("curated quote library", () => {
  it("includes the new voice and freedom quotes", () => {
    expect(quoteLibrary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "若每个人都坚持让自己的声音钻出身体，都以不亢不卑的行为和姿态，在天空中传播一种自由气息，这样生活就有望了。",
          source: "王开岭《精神明亮的人》",
        }),
        expect.objectContaining({
          text: "太阳强烈，水波温柔。",
          source: "海子《活在这珍贵的人间》",
        }),
      ]),
    );
  });

  it("prioritizes boundary and self-expression quotes for angry moods", () => {
    const texts = selectQuoteCandidates("angry").map((quote) => quote.text);

    expect(texts).toContain(
      "若每个人都坚持让自己的声音钻出身体，都以不亢不卑的行为和姿态，在天空中传播一种自由气息，这样生活就有望了。",
    );
    expect(texts).toContain("外界的声音都是参考，你不开心就不要参考。");
  });

  it("prioritizes bright present-moment quotes for happy moods", () => {
    const texts = selectQuoteCandidates("happy").map((quote) => quote.text);

    expect(texts).toContain("太阳强烈，水波温柔。");
    expect(texts).toContain("追风赶月莫停留，平芜尽处是春山。");
  });
});
