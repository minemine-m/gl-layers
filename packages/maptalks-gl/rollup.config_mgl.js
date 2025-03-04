const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const pkg = require('./package.json');
const terser = require('@rollup/plugin-terser');
const sourcemaps = require('rollup-plugin-sourcemaps');
const inject = require('@rollup/plugin-inject');
// const replace = require('@rollup/plugin-replace');
// const stringReplace = require('rollup-plugin-string-replace');

const outputFile = pkg.mglmain;

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.com\n */`;

let outro = pkg.name + ' v' + pkg.version;
outro = `typeof console !== 'undefined' && console.log('${outro}');`;

module.exports = [
    {
        input: './index.js',
        plugins: [
            nodeResolve({
                module: true,
                // jsnext : true,
                main: true
            }),
            commonjs(),
            sourcemaps(),

            terser({
                mangle: true,
                compress: {
                    pure_getters: true,
                    drop_console: true, // 删除控制台(console)语句
                    drop_debugger: true, // 删除debugger语句
                    passes: 10 // 进行多次混淆以增加难度
                },
                keep_classnames: true,
                output: {
                    ecma: 2017,
                    // keep_quoted_props: true,
                    beautify: false,
                    // comments: '/^!/'
                    comments: false // 去除注释
                }
            }),
            // stringReplace({
            //     'maptalks': 'mapgeoglThree',
            // }),
            // stringReplace({
            //     // 指定文件范围，只在这些文件中进行替换
            //     // include: ['src/**/*.js'],
            //     // exclude: 'node_modules/**',  // 排除 node_modules
            //     replacements: [
            //       {
            //         // 匹配的字符串或正则表达式
            //         pattern: 'maptalks',
            //         // 替换成的内容
            //         replacement: 'mapgeoglThree',
            //       },
            //       {
            //         // 匹配的字符串或正则表达式
            //         pattern: '1.0.0-rc.39',
            //         // 替换成的内容
            //         replacement: '0.0.1',
            //       },
            //     //   {
            //     //     pattern: /__VERSION__/g,
            //     //     replacement: '1.0.0', // 替换成指定版本号
            //     //   },
            //     ],
            //   }),
            // replace({
            //     // 替换的字符串
            //     'maptalks': 'mapgeoglThree',
            //     // 可以添加更多的替换规则
            //     // 'oldString': 'newString',
            // }),
        ],
        output: {
            sourcemap: false,
            // banner,
            // outro,
            extend: true,
            name: 'maptalks',
            file: outputFile,
            format: 'esm'
        }
    }
];
