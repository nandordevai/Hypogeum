import scrape from 'html-metadata';

export default function (config) {
    config.setTemplateFormats([
        'md',
        'css',
        'njk',
        'js',
    ]);
    config.addPassthroughCopy('src/img');
    config.addPassthroughCopy('src/js');
    config.addPassthroughCopy({ 'src/main.css': 'main.css' });
    config.addGlobalData('layout', 'base');

    config.addPreprocessor('drafts', '*', (data, content) => {
        if (data.date?.getTime() > Date.now()) {
            return false;
        }
    });

    config.addPreprocessor('heading', 'md', (data, content) => {
        if (data.tags?.includes('post')) {
            return content.replaceAll('# ', '## ');
        }
    });

    config.addShortcode('mixcloud', function (url) {
        const parts = url.split('/').filter(item => item !== '');
        return `<iframe height="120" src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=%2F${parts[2]}%2F${parts[3]}%2F" allow="encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share;" ></iframe>`
    });

    config.addShortcode('bandcamp', async function (url) {
        try {
            const meta = await scrape(url);
            return `<iframe style="border: 0; width: 100%; height: 120px;" src="${meta.openGraph.video.url}" seamless><a href="${url}">${meta.openGraph.title}</a></iframe>`;
        } catch (err) {
            return `<a href="${url}">Bandcamp</a>`;
        }
    });

    config.addShortcode('youtube', function(url) {
        const [_, id] = url.split('=');
        return `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    })

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