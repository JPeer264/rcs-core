'use strict';

const rcs    = require('../lib/rcs');
const fs     = require('fs');
const expect = require('chai').expect;
const StringDecoder = require('string_decoder').StringDecoder;

const fixturesCwd = 'test/files/fixtures';
const resultsCwd  = 'test/files/results';

describe('replace', () => {
    beforeEach(() => {
        // reset counter and selectors for tests
        rcs.selectorLibrary.selectors           = {};
        rcs.selectorLibrary.attributeSelectors  = {};
        rcs.selectorLibrary.compressedSelectors = {};
        rcs.selectorLibrary.excludes            = [];

        rcs.keyframesLibrary.excludes            = [];
        rcs.keyframesLibrary.keyframes           = {};
        rcs.keyframesLibrary.compressedKeyframes = {};

        rcs.nameGenerator.resetCountForTests();
    });

    describe('replace.file*', () => {
        describe('replace.fileCss', () => {
            it('should return the modified css file', done => {
                rcs.replace.fileCss(fixturesCwd + '/css/style.css', (err, data) => {
                    expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/css/style.css', 'utf8'));

                    done();
                });
            });

            it('should prefix all selectors', done => {
                rcs.replace.fileCss(fixturesCwd + '/css/style.css', {
                    prefix: 'prefixed-'
                }, (err, data) => {
                    expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/css/style-prefix.css', 'utf8'));

                    done();
                });
            });

            it('should prefix all selectors with no random name', done => {
                rcs.replace.fileCss(fixturesCwd + '/css/style.css', {
                    prefix: 'prefixed-',
                    preventRandomName: true
                }, (err, data) => {
                    expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/css/style-prefix-preventrandomname.css', 'utf8'));

                    done();
                });
            });

            it('should replace the selector attributes correctly', done => {
                rcs.replace.fileCss(fixturesCwd + '/css/css-attributes.css', (err, data) => {
                    expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/css/css-attributes.css', 'utf8'));

                    done();
                });
            });

            it('should replace the selector attributes with pre and suffixes correctly', done => {
                rcs.replace.fileCss(fixturesCwd + '/css/css-attributes.css', {
                    prefix: 'prefix-',
                    suffix: '-suffix'
                },(err, data) => {
                    expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/css/css-attributes-pre-suffix.css', 'utf8'));

                    done();
                });
            });

            it('should replace the selector attributes without caring about attribute selectors', done => {
                rcs.replace.fileCss(fixturesCwd + '/css/css-attributes.css', {
                    prefix: 'prefix-',
                    suffix: '-suffix',
                    ignoreAttributeSelector: true
                },(err, data) => {
                    expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/css/css-attributes-ignore.css', 'utf8'));

                    done();
                });
            });

            it('should modify the second one with the values from the first', done => {
                rcs.replace.fileCss(fixturesCwd + '/css/style.css', (err, data) => {
                    rcs.replace.fileCss(fixturesCwd + '/css/style2.css', (err, data) => {
                        expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/css/style2.css', 'utf8'));

                        done();
                    });
                });
            });

            it('should fail', done => {
                rcs.replace.fileCss('non/exisiting/path.css', (err, data) => {
                    expect(err).to.be.an('object');
                    expect(err.error).to.equal('ENOENT');

                    done();
                });
            });
        });

        describe('replace.fileCssSync', () => {
            it('should replace the selector attributes correctly', () => {
                const cssData = rcs.replace.fileCssSync(fixturesCwd + '/css/style.css');

                expect(cssData.data).to.equal(fs.readFileSync(resultsCwd + '/css/style.css', 'utf8'));
            });
        });

        describe('replace.file', () => {
            it('should fail', done => {
                rcs.replace.file('non/exisiting/path.css', (err, data) => {
                    expect(err).to.be.an('object');
                    expect(err.error).to.equal('ENOENT');

                    done();
                });
            });

            it('should return the modified html file', done => {
                rcs.selectorLibrary.fillLibrary(fs.readFileSync(fixturesCwd + '/css/style.css', 'utf8'))

                rcs.replace.file(fixturesCwd + '/html/index.html', (err, data) => {
                    expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/html/index.html', 'utf8'));

                    done();
                });
            });

            it('should return the modified js file', done => {
                rcs.selectorLibrary.fillLibrary(fs.readFileSync(fixturesCwd + '/css/style.css', 'utf8'))

                rcs.replace.file(fixturesCwd + '/js/main.txt', (err, data) => {
                    expect(data.data).to.equal(fs.readFileSync(resultsCwd + '/js/main.txt', 'utf8'));

                    done();
                });
            });
        });

        describe('replace.fileSync', () => {
            it('should replace the selector attributes correctly', () => {
                rcs.selectorLibrary.fillLibrary(fs.readFileSync(fixturesCwd + '/css/style.css', 'utf8'));

                const htmlData = rcs.replace.fileSync(fixturesCwd + '/html/index.html');

                expect(htmlData.data).to.equal(fs.readFileSync(resultsCwd + '/html/index.html', 'utf8'));
            });
        });
    });

    describe('replace.buffer*', () => {
        describe('replace.bufferCss', () => {
            it('should return the modified css buffer', () => {
                const data = rcs.replace.bufferCss(fs.readFileSync(fixturesCwd + '/css/style.css'));

                expect(data.toString()).to.equal(fs.readFileSync(resultsCwd + '/css/style.css', 'utf8'));
            });

            it('should return the modified and minified css buffer', () => {
                const data = rcs.replace.bufferCss(new Buffer('.class{background-color:red}.class-two{color:rgb(0,0,0)}.class-three{color:rgb(1,1,1)}'));

                expect(data.toString()).to.equal('.a{background-color:red}.b{color:rgb(0,0,0)}.c{color:rgb(1,1,1)}');
            });

            it('should modify the second one with the values from the first', () => {
                const buffer1 = rcs.replace.bufferCss(fs.readFileSync(fixturesCwd + '/css/style.css'));
                const buffer2 = rcs.replace.bufferCss(fs.readFileSync(fixturesCwd + '/css/style2.css'));

                expect(buffer1.toString()).to.equal(fs.readFileSync(resultsCwd + '/css/style.css', 'utf8'));
                expect(buffer2.toString()).to.equal(fs.readFileSync(resultsCwd + '/css/style2.css', 'utf8'));
            });

            it('should modify the code properly | hex oneline', () => {
                const data = rcs.replace.bufferCss(new Buffer('.somediv{background:#616060}.anotherdiv{display:flex}'));

                expect(data.toString()).to.equal('.a{background:#616060}.b{display:flex}');
            });

            it('should modify the code properly | number oneline', () => {
                const data = rcs.replace.bufferCss(new Buffer('.somediv{translation:.30}.anotherdiv{display:flex}'));

                expect(data.toString()).to.equal('.a{translation:.30}.b{display:flex}');
            });

            it('should modify the code properly | filter oneline', () => {
                const data = rcs.replace.bufferCss(new Buffer('.somediv{filter: progid:DXImageTransform.Microsoft.gradient(enabled = false)}.anotherdiv{display:flex}'));

                expect(data.toString()).to.equal('.a{filter: progid:DXImageTransform.Microsoft.gradient(enabled = false)}.b{display:flex}');
            });

            it('should replace keyframes properly', () => {
                const string = `
                    @keyframes  move {
                        from {} to {}
                    }

                    .selector {
                        animation:move 4s;
                    }

                    .another-selector {
                        animation:     move     4s    ;
                    }
                `;

                const expectedString = `
                    @keyframes  a {
                        from {} to {}
                    }

                    .b {
                        animation:a 4s;
                    }

                    .c {
                        animation:     a     4s    ;
                    }
                `;
                const data = rcs.replace.bufferCss(new Buffer(string), { replaceKeyframes: true });

                expect(data.toString()).to.equal(expectedString);
            });

            it('should replace keyframes properly in nested animations', () => {
                const string = `
                    @keyframes  moVe-It_1337 {
                        from {} to {}
                    }

                    @-webkit-keyframes  motion {
                        from {} to {}
                    }

                    @keyframes  motion {
                        from {} to {}
                    }

                    .selector {
                        animation-name: moVe-It_1337, motion;
                        animation:  moVe-It_1337 4s infinite,
                                    moVe-It_1337 10s,
                                    motion 2s,
                                    not-setted-keyframe 2s;
                    }

                    .another-selector {
                        animation:     moVe-It_1337     4s  , motion 10s  ;
                    }
                `;

                const expectedString = `
                    @keyframes  a {
                        from {} to {}
                    }

                    @-webkit-keyframes  b {
                        from {} to {}
                    }

                    @keyframes  b {
                        from {} to {}
                    }

                    .c {
                        animation-name: a, b;
                        animation:  a 4s infinite,
                                    a 10s,
                                    b 2s,
                                    not-setted-keyframe 2s;
                    }

                    .d {
                        animation:     a     4s  , b 10s  ;
                    }
                `;
                const data = rcs.replace.bufferCss(new Buffer(string), { replaceKeyframes: true });

                expect(data.toString()).to.equal(expectedString);
            });

            it('should not replace keyframes properly', () => {
                const string = `
                    @keyframes  move {
                        from {} to {}
                    }

                    .selector {
                        animation: move 4s;
                    }

                    .another-selector {
                        animation:     move     4s    ;
                    }
                `;

                const expectedString = `
                    @keyframes  move {
                        from {} to {}
                    }

                    .a {
                        animation: move 4s;
                    }

                    .b {
                        animation:     move     4s    ;
                    }
                `;
                const data = rcs.replace.bufferCss(new Buffer(string));

                expect(data.toString()).to.equal(expectedString);
            });

            it('should replace keyframes properly in a oneliner', () => {
                const string = '@keyframes  move {from {} to {}}.selector {animation: move 4s, move 4s infinite, do-not-trigger: 10s infinite}.another-selector {animation:     move     4s    }';
                const expectedString = '@keyframes  a {from {} to {}}.b {animation: a 4s, a 4s infinite, do-not-trigger: 10s infinite}.c {animation:     a     4s    }';
                const data = rcs.replace.bufferCss(new Buffer(string), { replaceKeyframes: true });

                expect(data.toString()).to.equal(expectedString);
            });

            it('should replace media queries properly in a oneliner', () => {
                const string = '@media(max-width:480px){.one{display:block}.two{display:table}}';
                const expectedString = '@media(max-width:480px){.a{display:block}.b{display:table}}';
                const data = rcs.replace.bufferCss(new Buffer(string));

                expect(data.toString()).to.equal(expectedString);
            });

            it('should replace sizes at the end w/o semicolon properly in a oneliner', () => {
                const string = '.one{padding:0 .357143rem}.two{color:#0f705d}';
                const expectedString = '.a{padding:0 .357143rem}.b{color:#0f705d}';
                const data = rcs.replace.bufferCss(new Buffer(string), { replaceKeyframes: true });

                expect(data.toString()).to.equal(expectedString);
            });

            it('should fail - empty buffer', () => {
                const data = rcs.replace.bufferCss(new Buffer(''));

                expect(data.toString()).to.equal('');
            });
        });

        describe('replace.bufferJs', () => {
            beforeEach(() => rcs.selectorLibrary.fillLibrary(fs.readFileSync(fixturesCwd + '/css/style.css', 'utf8')));

            it('should buffer some js', () => {
                const bufferedJs = rcs.replace.bufferJs(new Buffer(`
                    var test = ' something ';
                    const myClass = "jp-block";
                `))
                const expectedOutput = `
                    var test = ' something ';
                    const myClass = "a";
                `;

                expect(bufferedJs.toString()).to.equal(expectedOutput);
            });

            it('should replace everything', () => {
                const bufferedJs = rcs.replace.bufferJs(fs.readFileSync(fixturesCwd + '/js/complex.txt'));
                const expectedOutput = fs.readFileSync(resultsCwd + '/js/complex.txt', 'utf8');

                expect(bufferedJs.toString()).to.equal(expectedOutput);
            });

            it('should replace react components', () => {
                const bufferedJs = rcs.replace.bufferJs(fs.readFileSync(fixturesCwd + '/js/react.txt'), { jsx: true });
                const expectedOutput = fs.readFileSync(resultsCwd + '/js/react.txt', 'utf8');

                expect(bufferedJs.toString()).to.equal(expectedOutput);
            });
        });

        describe('replace.buffer', () => {
            it('should fail', () => {
                const data = rcs.replace.buffer(new Buffer(''));

                expect(data.toString()).to.equal('');
            });

            it('should return the modified html buffer', () => {
                rcs.selectorLibrary.fillLibrary(fs.readFileSync(fixturesCwd + '/css/style.css', 'utf8'));

                const buffer2 = rcs.replace.buffer(fs.readFileSync(fixturesCwd + '/html/index.html'));

                expect(buffer2.toString()).to.equal(fs.readFileSync(resultsCwd + '/html/index.html', 'utf8'));
            });

            it('should return the modified js buffer', () => {
                rcs.selectorLibrary.fillLibrary(fs.readFileSync(fixturesCwd + '/css/style.css', 'utf8'));

                const buffer2 = rcs.replace.buffer(fs.readFileSync(fixturesCwd + '/js/main.txt'));

                expect(buffer2.toString()).to.equal(fs.readFileSync(resultsCwd + '/js/main.txt', 'utf8'));
            });
        });
    });

    describe('replace.string', () => {

    });
});
