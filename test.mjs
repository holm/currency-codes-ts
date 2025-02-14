import cc from "./dist/mjs/index.js";
import assert from "assert";

// default export
assert.strictEqual(cc.code("EUR")?.countries.length, 36);
assert.strictEqual(cc.code("USS")?.countries, undefined);
assert.strictEqual(cc.code("USS", { historical: true })?.countries.length, 1);
assert.strictEqual(
  cc.code("USS", { historical: "2014-02" })?.countries.length,
  1
);
assert.strictEqual(
  cc.code("USS", { historical: "2020-01" })?.countries,
  undefined
);
assert.strictEqual(cc.code("IDR")?.digits, 2);
assert.strictEqual(cc.code("USS")?.digits, undefined);
assert.strictEqual(cc.code("USS", { historical: true })?.digits, 0);
assert.strictEqual(cc.number("967")?.currency, "Zambian Kwacha");
assert.strictEqual(cc.number(967)?.currency, "Zambian Kwacha");
assert.strictEqual(cc.number(998)?.currency, undefined);
assert.strictEqual(
  cc.number(998, { historical: true })?.currency,
  "US Dollar (Same day)"
);
assert.strictEqual(cc.country("Colombia").length, 2);
assert.strictEqual(cc.country("colombia").length, 2);
assert.strictEqual(cc.country("United States").length, 0);
assert.strictEqual(cc.country("United States", { historical: true }).length, 1);
assert.strictEqual(cc.codes().length, 180);
assert.strictEqual(cc.codes({ historical: true }).length, 304);
assert.strictEqual(cc.codes({ historical: "1700-01" }).length, 304);
assert.strictEqual(cc.codes({ historical: "2010-01" }).length, 191);
assert.strictEqual(cc.codes({ historical: "2100-01" }).length, 180);
assert.strictEqual(cc.countries().length, 260);
assert.strictEqual(cc.countries({ historical: true }).length, 290);
assert.strictEqual(cc.numbers().length, 180);
assert.strictEqual(cc.numbers({ historical: true }).length, 255);
assert.strictEqual(cc.numbers()[0], "104");
assert.strictEqual(cc.numbers({ historical: true })[0], "100");
assert.strictEqual(cc.data.length, 180);

console.log("tests passed 🎉");
