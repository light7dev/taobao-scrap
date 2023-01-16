import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

const main = () => {
  const filePath = `./scrapers/scraper.js`;
  let scraperModule = require(filePath)['scraperModule'];
  scraperModule.processFetch();
};

main();