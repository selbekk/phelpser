#!/usr/bin/env node

require('isomorphic-fetch');

const { get } = require('fetchutils');
const jsdom = require('jsdom');
require('colors');

let urlToCrawl = process.argv[2];

if (!urlToCrawl) {
  console.error('You need to specify which website to crawl.'.red);
  console.error('Usage: phelpser example.com');
  return;
}

if (!urlToCrawl.startsWith('http')) {
  urlToCrawl = `http://${urlToCrawl}`;
}

let [protocol, , domain] = urlToCrawl.split('/');
domain = domain.replace('www.', '');

const visitedPages = {};

const baseUrl = `${protocol}//${domain}`;

const crawlLink = async (url) => {
    if (visitedPages[url]) {
        return;
    }

    try {
        visitedPages[url] = true;
        const body = await get(url);
        console.log(`${url} returned 200 OK`.green);
        jsdom.env(body, [], async (err, window) => {
            Array.from(window.document.querySelectorAll('a[href]'))
                .map(el => el.getAttribute('href'))
                .map(href => href.startsWith('/') ? baseUrl + href : href)
                .filter(href => href.startsWith('http') && href.includes(domain) && !visitedPages[href])
                .forEach(crawlLink);
        });
    } catch (e) {
        if (e.status === 404) {
          console.log(`${url} returned 404`.bgRed);
        } else if (e.status) {
          console.log(`${url} failed with a ${e.status} ${e.message}`.yellow);
        } else if (e.code === 'ENOTFOUND') {
          console.error(`Could not find the domain ${urlToCrawl}`.bgRed);
        } else {
          console.warn(`${url} threw an error:`.yellow, e);
        }
        visitedPages[url] = { status: e.status };
    }
}

crawlLink(baseUrl);
