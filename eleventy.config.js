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