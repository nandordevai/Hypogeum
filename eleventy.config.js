import scrape from 'html-metadata';

export default function (eleventyConfig) {
    eleventyConfig.setTemplateFormats([
        'md',
        'css',
        'njk',
        'js',
    ]);
    eleventyConfig.addPassthroughCopy('src/img');
    eleventyConfig.addPassthroughCopy('src/js');
    eleventyConfig.addPassthroughCopy({ 'src/main.css': 'main.css' });
    eleventyConfig.addGlobalData('layout', 'base');

    eleventyConfig.addPreprocessor('heading', 'md', (data, content) => {
        if (data.tags?.includes('post')) {
            return content.replaceAll('# ', '## ');
        }
    });

    eleventyConfig.addShortcode('mixcloud', function (url) {
        const parts = url.split('/').filter(item => item !== '');
        return `<iframe height="120" src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=%2F${parts[2]}%2F${parts[3]}%2F" allow="encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share;" ></iframe>`
    });

    eleventyConfig.addShortcode('bandcamp', async function (url) {
        try {
            const meta = await scrape(url);
            return `<iframe style="border: 0; width: 100%; height: 120px;" src="${meta.openGraph.video.url}" seamless><a href="${url}">${meta.openGraph.title}</a></iframe>`;
        } catch (err) {
            return `<a href="${url}">Bandcamp</a>`;
        }
    });

    return {
	    htmlTemplateEngine: 'njk',
        dir: {
            input: 'src',
            output: 'docs',
            includes: '../_includes',
            layouts: '../_layouts',
        },
    };
}