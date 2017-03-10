#!/usr/bin/env node

require('isomorphic-fetch');

const { get } = require('fetchutils');
const jsdom = require('jsdom');
require('colors');

const visitedPages = {};

const urlToCrawl = process.argv[2];
const [protocol, , domain] = urlToCrawl.split('/');
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
                .filter(href => href.includes(baseUrl) && !visitedPages[href])
                .forEach(crawlLink);
        });
    } catch (e) {
        if (e.status === 404) console.log(`${url} returned a 404`.bgRed)
        else console.log(`${url} returned ${e.status}`)
        visitedPages[url] = { status: e.status };
    }
}

crawlLink(baseUrl);
