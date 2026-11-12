import scrape from 'html-metadata';
import path from "node:path";
import * as sass from "sass";
import { readFileSync, writeFileSync } from 'fs';
import { EleventyRenderPlugin } from '@11ty/eleventy';

const bandcamp = JSON.parse(readFileSync('./_data/bandcamp.json'));
const issues = JSON.parse(readFileSync('./_data/issues.json'));
const excerptSeparator = '<!-- more -->';
const isProduction = process.env.ELEVENTY_RUN_MODE === 'build';

export default function (config) {
    config.setTemplateFormats([
        'md',
        'css',
        'njk',
        'js',
    ]);
    config.addTemplateFormats('scss');
    config.addPassthroughCopy('src/img');
    config.addPassthroughCopy('src/js');
    config.addPassthroughCopy('src/fonts');
    config.addPassthroughCopy({ 'src/scss/main.css': 'main.css' });
    config.addPassthroughCopy({ 'src/CNAME': 'CNAME' });
    config.addPlugin(EleventyRenderPlugin);
    config.addWatchTarget('src/scss');

    // data

    config.addGlobalData('layout', 'base');

    config.addGlobalData('currentIssue', function () {
        return Math.max(Object.keys(issues));
    });

    config.addGlobalData('currentIssueDate', function () {
        return issues[Math.max(Object.keys(issues))].date;
    });

    // preprocessor

    config.addPreprocessor('drafts', 'md', (data, _content) => {
        if (data.draft && isProduction) {
            return false;
        }
    });

    config.addPreprocessor('heading', 'md', (data, content) => {
        if (data.tags?.includes('post') || data.tags?.includes('page')) {
            return content.replaceAll('# ', '## ');
        }
    });

    // shortcode

    config.addShortcode('mixcloud', (url) => {
        const parts = url.split('/').filter(item => item !== '');
        return `<iframe height="120" src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=%2F${parts[2]}%2F${parts[3]}%2F" allow="encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share;" ></iframe>`
    });

    config.addShortcode('bandcamp', async (url) => {
        if (!bandcamp[url]) {
            try {
                const meta = await scrape(url);
                bandcamp[url] = { videoURL: meta.openGraph.video.url, title: meta.openGraph.title };
                writeFileSync('./_data/bandcamp.json', JSON.stringify(bandcamp));
            } catch (err) {
                return `<a href="${url}">Bandcamp</a>`;
            }
        }
        return `<iframe class="bandcamp" style="border: 0; width: 100%; height: 120px;" src="${bandcamp[url].videoURL}" seamless><a href="${url}">${bandcamp[url].title}</a></iframe>`;

    });

    config.addShortcode('youtube', (url) => {
        const src = url.replace('watch?v=', 'embed/');
        return `<iframe class="youtube" src="${src}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    });

    // transform

    config.addTransform('removeExcerptMarker', (content, outputPath) => (
        outputPath && outputPath?.endsWith('.html')
            ? content.replaceAll(excerptSeparator, '')
            : content
    ));

    // filter

    config.addFilter('excerpt', (content, _url) => (
        content.includes(excerptSeparator)
            ? content.split(excerptSeparator)[0]
            : content
    ));

    config.addFilter('formatIssueDate', function (date) {
        const options = { month: 'long', year: 'numeric', timeZone: 'UTC' };
        return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
    });

    // collection

    const getMonthKey = (date) => {
        const d = new Date(date);
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
    };

    config.addCollection('issues', (collection) => {
        const posts = collection.getFilteredByTag('post').sort((a, b) => b.date - a.date);
        const groups = {};
        posts.forEach((post) => {
            const key = getMonthKey(post.date);
            if (!groups[key]) {
                groups[key] = {
                    issueKey: key,
                    date: post.date,
                    posts: []
                };
            }
            groups[key].posts.push(post);
        });
        return Object.values(groups).sort((a, b) => b.issueKey.localeCompare(a.issueKey));
    });

    config.addCollection('currentIssue', (collection) => {
        const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

        let activeNum = null;
        Object.keys(issues).forEach(volNum => {
            if (issues[volNum].date <= today) {
                if (!activeNum || Number(volNum) > Number(activeNum)) {
                    activeNum = volNum;
                }
            }
        });

        if (!activeNum) return [];

        const currentPosts = collection.getFilteredByTag('post').filter(post => {
            const postIssue = post.data.issue ?? 0;
            return String(postIssue) === String(activeNum);
        }).sort((a, b) => a.data.order - b.data.order);
        return currentPosts;
    });

    config.addCollection('menu', (collection) => {
        return collection.getFilteredByTag('page').sort((a, b) => a.data.order - b.data.order);
    });

    config.addCollection('archive', (collection) => {
        const posts = collection.getFilteredByTag('post')
            .filter((post) => post.date < new Date('2026-10-01T00:00:00Z'))
            .sort((a, b) => b.date.getTime() - a.date.getTime());
        return posts;
    });

    // extension
    config.addExtension('scss', {
        outputFileExtension: 'css',
        useLayouts: false,
        compileOptions: {
            permalink: function(_contents, inputPath) {
                let parsed = path.parse(inputPath);
                if (parsed.name.startsWith("_")) return false;

                return `/${parsed.name}.css`;
            }
        },
        compile: async function (inputContent, inputPath) {
            if (path.basename(inputPath).startsWith('_')) return;

            let result = sass.compileString(inputContent, {
                loadPaths: [
                    path.dirname(inputPath),
                    'src/scss'
                ]
            });
            this.addDependencies(inputPath, result.loadedUrls);
            return async () => result.css;
        },
    });

    return {
        htmlTemplateEngine: 'njk',
        dir: {
            input: 'src',
            output: 'docs',
            layouts: '../_layouts',
            includes: '../_includes',
        },
    };
}