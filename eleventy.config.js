export default function (eleventyConfig) {
    eleventyConfig.setTemplateFormats([
        'md',
        'css',
        'njk',
    ]);
    eleventyConfig.addPassthroughCopy('src/img');
    eleventyConfig.addPassthroughCopy({ 'src/main.css': 'main.css' });
    eleventyConfig.addGlobalData('layout', 'base');

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