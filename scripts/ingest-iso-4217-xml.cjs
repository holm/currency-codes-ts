const fs = require("fs");
const xml2js = require("xml2js");
const util = require("util");
const _ = require("lodash");

require("@gouch/to-title-case");

const outputPublishDateFile = "src/iso-4217-publish-date.ts";
const outputTypesFile = "src/types.ts";

function parseEntry(entry) {
  return {
    code: entry.Ccy?._,
    number: entry.CcyNbr?._,
    digits: (entry.CcyMnrUnts && parseInt(entry.CcyMnrUnts._)) || 0,
    currency: entry.CcyNm?._,
    country: entry.CtryNm?._?.toLowerCase()?.toTitleCase(),
    withdraval: entry.WthdrwlDt?._,
  };
}

async function processFile(name) {
  const data = await fs.promises.readFile(name);

  const parseStringP = util.promisify(xml2js.parseString);

  const result = await parseStringP(data, {
    explicitArray: false, // turn off array wrappers around content
    explicitCharkey: true, // put all content under a key so its easier to parse when there are attributes
    mergeAttrs: true, // lift attributes up so they're easier to parse
  });

  const isoRoot = result.ISO_4217;
  const entries = isoRoot.CcyTbl
    ? isoRoot.CcyTbl.CcyNtry
    : isoRoot.HstrcCcyTbl.HstrcCcyNtry;

  return {
    entries: entries
      .map((entry) => parseEntry(entry))
      .filter((entry) => entry.code),
    publishDate: isoRoot.Pblshd,
  };
}

function generatePreamble(publishDate) {
  return (
    "/*\n" +
    "\tFollows ISO 4217, https://www.six-group.com/en/products-services/financial-information/data-standards.html#scrollTo=currency-codes\n" +
    "\tSee https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml\n" +
    "and https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-three.xml\n" +
    "\tData last updated " +
    publishDate +
    "\n" +
    "*/\n\n"
  );
}

async function writeData(countries, preamble, outputDataFile) {
  // TypeScript style export and added type
  const dataContent =
    preamble +
    'import { CurrencyCodeEntry } from "./types";\n' + // Explicitly import type
    "const data: CurrencyCodeEntry[] = " +
    JSON.stringify(countries, null, "  ") +
    ";\n" +
    "export default data;";

  await fs.promises.writeFile(outputDataFile, dataContent);

  console.log("Ingested into " + outputDataFile);
}

async function writePublishDate(publishDate, preamble) {
  const publishDateContent =
    preamble +
    "export default " +
    JSON.stringify(publishDate, null, "  ") +
    ";";

  await fs.promises.writeFile(outputPublishDateFile, publishDateContent);

  console.log("Wrote publish date to " + outputPublishDateFile);
}

async function writeTypes(entries) {
  // Prepare content for CurrencyCode type
  const currencyCodes = _.sortBy(_.uniq(entries.map((c) => c.code)))
    .map((code) => JSON.stringify(code))
    .join(" | ");

  // Prepare content for Country type
  const countryNames = _.sortBy(_.uniq(entries.map((c) => c.country)))
    .map((country) => JSON.stringify(country))
    .join(" | ");

  const typesContent = `// Types generated based on ISO 4217 currency codes and countries
export type CurrencyCode = ${currencyCodes};
export type Country = ${countryNames};

export interface CurrencyCodeRecord {
  code: CurrencyCode;
  number?: string;
  digits: number;
  currency: string;
  countries: Country[];
};

export interface CurrencyCodeEntry {
  code: CurrencyCode;
  number?: string;
  digits: number;
  currency: string;
  country: Country;
  withdraval?: string;
};`;

  await fs.promises.writeFile(outputTypesFile, typesContent);

  console.log("Wrote TypeScript types to " + outputTypesFile);
}

async function ingest() {
  const { entries: currentEntries, publishDate } = await processFile(
    "iso-4217-list-one.xml"
  );
  const { entries: historicalEntries } = await processFile(
    "iso-4217-list-three.xml"
  );
  const allEntries = [...currentEntries, ...historicalEntries];

  const preamble = generatePreamble(publishDate);

  await writeData(currentEntries, preamble, "src/data.ts");
  await writeData(
    _.reverse(_.sortBy(historicalEntries, "withdrawal")),
    preamble,
    "src/data-historical.ts"
  );
  await writePublishDate(publishDate, preamble);
  await writeTypes(allEntries);
}

ingest();
