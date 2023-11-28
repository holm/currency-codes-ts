import _ from "lodash";
import currentEntries from "./data.js";
import historicalEntries from "./data-historical.js";
import publishDate from "./iso-4217-publish-date.js";
import { CurrencyCode, CurrencyCodeEntry, CurrencyCodeRecord } from "./types";

export type CurrencyOptions = {
  historical?: boolean | string;
};

const resolveEntries = ({
  historical = false,
}: CurrencyOptions = {}): CurrencyCodeEntry[] => {
  if (!historical) {
    return currentEntries;
  }

  const filteredHistorical = historicalEntries.filter(
    (entry) =>
      historical === true ||
      (entry.withdraval && entry.withdraval >= historical)
  );

  return [...currentEntries, ...filteredHistorical];
};

const resolveEntriesByCode = _.memoize(
  (options?: CurrencyOptions): Record<string, CurrencyCodeEntry[]> => {
    const entries = resolveEntries(options);

    return _.groupBy(entries, (entry) => entry.code);
  }
);

const resolveEntriesByCountry = _.memoize(
  (options?: CurrencyOptions): Record<string, CurrencyCodeEntry[]> => {
    const entries = resolveEntries(options);

    return _.groupBy(entries, (entry) => entry.country.toLowerCase());
  }
);

const resolveEntriesByNumber = _.memoize(
  (options?: CurrencyOptions): Record<string, CurrencyCodeEntry[]> => {
    const entries = resolveEntries(options).filter((entry) => entry.number);

    return _.groupBy(entries, (entry) => entry.number);
  }
);

const entriesToRecord = (entries: CurrencyCodeEntry[]): CurrencyCodeRecord => {
  return {
    ..._.pick(entries[0], ["code", "number", "digits", "currency"]),
    countries: _.uniq(_.map(entries, "country")),
  };
};

/**
 * Retrieve the currency details by its ISO 4217 code.
 *
 * @param {string} code - The ISO 4217 code of the currency.
 * @returns {CurrencyCodeRecord | undefined} - The record of the currency if found, otherwise undefined.
 */
export const code = (
  code: string,
  options?: CurrencyOptions
): CurrencyCodeRecord | undefined => {
  const groupedEntries = resolveEntriesByCode(options);

  const matchingEntries = groupedEntries[code.toLocaleUpperCase()];
  if (matchingEntries) {
    return entriesToRecord(matchingEntries);
  }
};

/**
 * Retrieve the currency details by the name of the country.
 *
 * @param {string} country - The name of the country.
 * @returns {CurrencyCodeEntry[]} - An array of currency entries that match the country name.
 */
export const country = (
  country: string,
  options?: CurrencyOptions
): CurrencyCodeEntry[] => {
  const groupedEntries = resolveEntriesByCountry(options);

  return groupedEntries[country.toLowerCase()] || [];
};

/**
 * Retrieve the currency details by its ISO 4217 number.
 *
 * @param {number|string} number - The ISO 4217 number of the currency.
 * @returns {CurrencyCodeRecord | undefined} - The record of the currency if found, otherwise undefined.
 */
export const number = (
  number: number | string,
  options?: CurrencyOptions
): CurrencyCodeRecord | undefined => {
  const groupedEntries = resolveEntriesByNumber(options);

  const matchingEntries = groupedEntries[String(number)];
  if (matchingEntries) {
    return entriesToRecord(matchingEntries);
  }
};

/**
 * Get a list of all ISO 4217 currency codes.
 *
 * @returns {CurrencyCode[]} - An array of ISO 4217 currency codes.
 */
export const codes = (options?: CurrencyOptions): CurrencyCode[] => {
  const groupedEntries = resolveEntriesByCode(options);

  return _.keys(groupedEntries) as CurrencyCode[];
};

/**
 * Get a list of all ISO 4217 currency numbers.
 *
 * @returns {string[]} - An array of ISO 4217 currency numbers.
 */
export const numbers = (options?: CurrencyOptions): string[] => {
  const groupedEntries = resolveEntriesByNumber(options);

  return _.keys(groupedEntries);
};

/**
 * Get a list of all countries.
 *
 * @returns {string[]} - An array of country names.
 */
export const countries = (options?: CurrencyOptions): string[] => {
  const groupedEntries = resolveEntriesByCountry(options);

  return _.keys(groupedEntries);
};

const data = _.values(resolveEntriesByCode()).map((entries) =>
  entriesToRecord(entries)
);

export { data };

export default {
  code,
  country,
  number,
  codes,
  numbers,
  countries,
  publishDate,
  data,
};
