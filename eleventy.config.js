import scrape from 'html-metadata';
import { readFileSync, writeFileSync } from 'fs';
import { EleventyRenderPlugin } from '@11ty/eleventy';

const bandcamp = JSON.parse(readFileSync('./_data/bandcamp.json'));
const excerptSeparator = '<!-- more -->';
const isProduction = process.env.ELEVENTY_RUN_MODE === 'build';

export default function (config) {
    config.setTemplateFormats([
        'md',
        'css',
        'njk',
        'js',
    ]);
    config.addPassthroughCopy('src/img');
    config.addPassthroughCopy('src/js');
    config.addPassthroughCopy('src/fonts');
    config.addPassthroughCopy({ 'src/main.css': 'main.css' });
    config.addPassthroughCopy({ 'src/CNAME': 'CNAME' });
    config.addGlobalData('layout', 'base');
    config.addPlugin(EleventyRenderPlugin);

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
                return `<iframe style="border: 0; width: 100%; height: 120px;" src="${meta.openGraph.video.url}" seamless><a href="${url}">${meta.openGraph.title}</a></iframe>`;
            } catch (err) {
                return `<a href="${url}">Bandcamp</a>`;
            }
        } else {
            return `<iframe style="border: 0; width: 100%; height: 120px;" src="${bandcamp[url].videoURL}" seamless><a href="${url}">${bandcamp[url].title}</a></iframe>`;
        }
    });

    config.addShortcode('youtube', (url) => {
        const src = url.replace('watch?v=', 'embed/');
        return `<iframe src="${src}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    });

    config.addTransform('removeExcerptMarker', (content, outputPath) => (
        outputPath?.endsWith('.html')
            ? content.replaceAll(excerptSeparator, '')
            : content
    ));

    config.addFilter('excerpt', (content, url) => {
        if (content.includes(excerptSeparator)) {
            const excerpt = content.split(excerptSeparator)[0];
            return `${excerpt}<p><a href="${url}">Read more »</a></p>`;
        }
        return content;
    });

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
        const issues = config.getCollections().issues(collection);
        return issues.length > 0 ? issues[0] : { posts: [] };
    });

    config.addCollection('menu', (collection) => {
        return collection.getFilteredByTag('page').sort((a, b) => a.data.order - b.data.order);
    });

    config.addCollection('archive', (collection) => {
        const posts = collection.getFilteredByTag('post')
            .filter((post) => post.date < new Date('2026-10-01T00:00:00Z'))
            .sort((a, b) => b.date.getTime() - a.date.getTime());
        console.log(`found ${posts.length} posts`)
        return posts;
    });

    config.addFilter('formatIssueDate', function(date) {
        const options = { month: 'long', year: 'numeric', timeZone: 'UTC' };
        return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
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