/*
 * testPOFile.js - test the po and pot file handler object.
 *
 * Copyright © 2021, Box, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var path = require("path");
var fs = require("fs");

if (!POFile) {
    var POFile = require("../POFile.js");
    var POFileType = require("../POFileType.js");

    var CustomProject =  require("loctool/lib/CustomProject.js");
    var TranslationSet =  require("loctool/lib/TranslationSet.js");
    var ResourceString =  require("loctool/lib/ResourceString.js");
    var ResourcePlural =  require("loctool/lib/ResourcePlural.js");
    var ResourceArray =  require("loctool/lib/ResourceArray.js");
}

function diff(a, b) {
    var min = Math.min(a.length, b.length);

    for (var i = 0; i < min; i++) {
        if (a[i] !== b[i]) {
            console.log("Found difference at character " + i);
            console.log("a: " + a.substring(i));
            console.log("b: " + b.substring(i));
            break;
        }
    }
}

var p = new CustomProject({
    name: "foo",
    id: "foo",
    sourceLocale: "en-US"
}, "./test/testfiles", {
    locales:["en-GB"],
    targetDir: ".",
    nopseudo: true,
    po: {
        mappings: {
            "**/messages.po": {
                "template": "resources/[locale].po"
            },
            "**/template.po": {
                "template": "resources/template_[locale].po"
            },
            "**/*.pot": {
                "template": "[dir]/[locale].po"
            },
            "**/*.po": {
                "template": "[dir]/[locale].po"
            }
        }
    }
});
var t = new POFileType(p);

var p2 = new CustomProject({
    name: "foo",
    id: "foo",
    sourceLocale: "en-US"
}, "./test/testfiles", {
    locales:["en-GB"],
    identify: true,
    targetDir: "testfiles"
});

var t2 = new POFileType(p2);

module.exports.pofile = {
    testPOFileConstructor: function(test) {
        test.expect(1);

        var pof = new POFile({project: p, type: t});
        test.ok(pof);

        test.done();
    },

    testPOFileConstructorParams: function(test) {
        test.expect(1);

        var pof = new POFile({
            project: p,
            pathName: "./testfiles/po/messages.po",
            type: t
        });

        test.ok(pof);

        test.done();
    },

    testPOFileConstructorNoFile: function(test) {
        test.expect(1);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        test.done();
    },

    testPOFileSourceLocaleGiven: function(test) {
        test.expect(2);

        var pof = new POFile({
            project: p,
            sourceLocale: "en-US",
            type: t
        });
        test.ok(pof);
        
        test.equal(pof.getSourceLocale(), "en-US");

        test.done();
    },

    testPOFileSourceLocaleDefault: function(test) {
        test.expect(2);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);
        
        test.equal(pof.getSourceLocale(), "en-US");

        test.done();
    },

    testPOFileTargetLocaleGiven: function(test) {
        test.expect(2);

        var pof = new POFile({
            project: p,
            sourceLocale: "de-DE",
            type: t
        });
        test.ok(pof);
        
        test.equal(pof.getTargetLocale(), "de-DE");

        test.done();
    },

    testPOFileTargetLocaleInferredFromPath: function(test) {
        test.expect(2);

        var pof = new POFile({
            project: p,
            pathName: "resources/de-DE.po",
            type: t
        });
        test.ok(pof);
        
        test.equal(pof.getTargetLocale(), "de-DE");

        test.done();
    },

    testPOFileParseSimple: function(test) {
        test.expect(6);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n');

        var set = pof.getTranslationSet();
        test.ok(set);

        var r = set.get(ResourceString.hashKey("foo", "en-US", "string 1", "po"));
        test.ok(r);

        test.equal(r.getSource(), "string 1");
        test.equal(r.getKey(), "string 1");
        test.equal(r.getType(), "string");

        test.done();
    },

    testPOFileParseWithContext: function(test) {
        test.expect(7);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            'msgctxt "context 1"\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        var r = set.get(ResourceString.hashKey("foo", "en-US", "string 1", "po"));
        test.ok(r);

        test.equal(r.getSource(), "string 1");
        test.equal(r.getKey(), "string 1");
        test.equal(r.getType(), "string");
        test.equal(r.getContext(), "context 1");

        test.done();
    },

    testPOFileParseSimpleWithTranslation: function(test) {
        test.expect(9);

        var pof = new POFile({
            project: p,
            locale: "de-DE",
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            'msgstr "this is string one"\n');

        var set = pof.getTranslationSet();
        test.ok(set);

        var r = set.get(ResourceString.hashKey("foo", "en-US", "string 1", "po"));
        test.ok(r);

        test.equal(r.getSource(), "string 1");
        test.equal(r.getSourceLocale(), "en-US");
        test.equal(r.getKey(), "string 1");
        test.equal(r.getTarget(), "this is string one");
        test.equal(r.getTargetLocale(), "de-DE");
        test.equal(r.getType(), "string");

        test.done();
    },

    testPOFileParseSimpleRightStrings: function(test) {
        test.expect(8);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            'msgstr "this is string one"\n' +
            '\n' +
            'msgid "string 2"\n' +
            'msgstr "this is string two"\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 2);
        var resources = set.getAll();
        test.equal(resources.length, 2);

        test.equal(resources[0].getSource(), "string 1");
        test.equal(resources[0].getKey(), "string 1");
        test.equal(resources[0].getTarget(), "this is string one");

        test.equal(resources[1].getSource(), "string 2");
        test.equal(resources[1].getKey(), "string 2");
        test.equal(resources[1].getTarget(), "this is string two");

        test.done();
    },

    testPOFileParsePluralString: function(test) {
        test.expect(8);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "one object"\n' +
            'msgid_plural "{$count} objects"\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 1);
        var resources = set.getAll();
        test.equal(resources.length, 1);

        test.equal(resources[0].getType(), "plural");
        var strings = resources[0].getSourceStrings();
        test.equal(strings.one, "one object");
        test.equal(strings.other, "{$count} objects");
        test.equal(resources[0].getKey(), "one object");
        test.ok(!resources[0].getTargetStrings());

        test.done();
    },

    testPOFileParsePluralStringWithTranslations: function(test) {
        test.expect(8);

        var pof = new POFile({
            project: p,
            locale: "de-DE",
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "one object"\n' +
            'msgid_plural "{$count} objects"\n' +
            'msgstr[0] "Ein Objekt"\n' +
            'msgstr[1] "{$count} Objekten"\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 1);
        var resources = set.getAll();
        test.equal(resources.length, 1);

        test.equal(resources[0].getType(), "plural");
        var strings = resources[0].getSourceStrings();
        test.equal(strings.one, "one object");
        test.equal(strings.other, "{$count} objects");
        test.equal(resources[0].getKey(), "one object");
        test.equal(resources[0].getSourceLocale(), "en-US");
        strings = resources[0].getTargetStrings();
        test.equal(strings.one, "Ein Objekt");
        test.equal(strings.other, "{$count} Objekten");
        test.equal(resources[0].getSourceLocale(), "de-DE");

        test.done();
    },

    testPOFileParsePluralStringWithTranslationsRussian: function(test) {
        test.expect(8);

        var pof = new POFile({
            project: p,
            locale: "ru-RU",
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "one object"\n' +
            'msgid_plural "{$count} objects"\n' +
            'msgstr[0] "{$count} объект"\n' +
            'msgstr[1] "{$count} объекта"\n' +
            'msgstr[2] "{$count} объектов"\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 1);
        var resources = set.getAll();
        test.equal(resources.length, 1);

        test.equal(resources[0].getType(), "plural");
        var strings = resources[0].getSourceStrings();
        test.equal(strings.one, "one object");
        test.equal(strings.other, "{$count} objects");
        test.equal(resources[0].getKey(), "one object");
        test.equal(resources[0].getSourceLocale(), "en-US");
        strings = resources[0].getTargetStrings();
        test.equal(strings.one, "{$count} объект");
        test.equal(strings.few, "{$count} объекта");
        test.equal(strings.other, "{$count} объектов");
        test.equal(resources[0].getSourceLocale(), "ru-RU");

        test.done();
    },

    testPOFileParseSimpleLineContinuations: function(test) {
        test.expect(7);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            '" and more string 1"\n' +
            'msgstr "this is string one "\n' +
            '"or the translation thereof. "\n' +
            '"Next line."\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 1);
        var resources = set.getAll();
        test.equal(resources.length, 1);

        test.equal(resources[0].getSource(), "string 1 and more string 1");
        test.equal(resources[0].getKey(), "string 1 and more string 1");
        test.equal(resources[0].getTarget(), "this is string one or the translation thereof. Next line.");

        test.done();
    },

    testPOFileParseSimpleLineContinuationsWithEmptyString: function(test) {
        test.expect(7);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid ""\n' + 
            '"string 1"\n' +
            '" and more string 1"\n' +
            'msgstr ""\n' + 
            '"this is string one "\n' +
            '"or the translation thereof. "\n' +
            '"Next line."\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 1);
        var resources = set.getAll();
        test.equal(resources.length, 1);

        test.equal(resources[0].getSource(), "string 1 and more string 1");
        test.equal(resources[0].getKey(), "string 1 and more string 1");
        test.equal(resources[0].getTarget(), "this is string one or the translation thereof. Next line.");

        test.done();
    },

    testPOFileParseEmptyTranslation: function(test) {
        test.expect(12);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        // only source strings
        pof.parse(
            'msgid "string 1"\n' +
            'msgstr ""\n' +
            '\n' +
            'msgid "string 2"\n' +
            'msgstr ""\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 2);
        var resources = set.getAll();
        test.equal(resources.length, 2);

        test.equal(resources[0].getSource(), "string 1");
        test.equal(resources[0].getKey(), "string 1");
        test.ok(!resources[0].getTarget());
        test.ok(!resources[0].getTargetLocale());

        test.equal(resources[1].getSource(), "string 2");
        test.equal(resources[1].getKey(), "string 2");
        test.ok(!resources[1].getTarget());
        test.ok(!resources[1].getTargetLocale());

        test.done();
    },

    testPOFileParseEmptySource: function(test) {
        test.expect(3);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid ""\n' +
            'msgstr "string 1"\n' +
            '\n' +
            'msgid ""\n' +
            'msgstr "string 2"\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        // no source = no string to translate!
        test.equal(set.size(), 0);

        test.done();
    },

    testPOFileParseFileHeader: function(test) {
        test.expect(3);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            '#, fuzzy\n' +
            'msgid ""\n' +
            'msgstr ""\n' +
            '"#-#-#-#-#  messages.pot  #-#-#-#-#\\n"\n' +
            '"Content-Type: text/plain; charset=UTF-8\\n"\n' +
            '"Content-Transfer-Encoding: 8bit\\n"\n' +
            '"Generated-By: loctool\\n"\n' +
            '"Project-Id-Version: 1\\n"\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        // no source = no string to translate!
        test.equal(set.size(), 0);

        test.done();
    },

    testPOFileParseDupString: function(test) {
        test.expect(8);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        // only source strings
        pof.parse(
            'msgid "string 1"\n' +
            'msgstr ""\n' +
            '\n' +
            'msgid "string 1"\n' +
            'msgstr ""\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 1);
        var resources = set.getAll();
        test.equal(resources.length, 1);

        test.equal(resources[0].getSource(), "string 1");
        test.equal(resources[0].getKey(), "string 1");
        test.ok(!resources[0].getTarget());
        test.ok(!resources[0].getTargetLocale());

        test.done();
    },

    testPOFileParseSameStringDifferentContext: function(test) {
        test.expect(14);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        // only source strings
        pof.parse(
            'msgid "string 1"\n' +
            'msgctxt "context 1"\n' +
            'msgstr ""\n' +
            '\n' +
            'msgid "string 1"\n' +
            'msgctxt "context 2"\n' +
            'msgstr ""\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 2);
        var resources = set.getAll();
        test.equal(resources.length, 2);

        test.equal(resources[0].getSource(), "string 1");
        test.equal(resources[0].getKey(), "string 1");
        test.equal(resources[0].getContext(), "context 1");
        test.ok(!resources[0].getTarget());
        test.ok(!resources[0].getTargetLocale());

        test.equal(resources[1].getSource(), "string 1");
        test.equal(resources[1].getKey(), "string 1");
        test.equal(resources[1].getContext(), "context 2");
        test.ok(!resources[1].getTarget());
        test.ok(!resources[1].getTargetLocale());

        test.done();
    },

    testPOFileParseTestInvalidPO: function(test) {
        test.expect(2);

        // when it's named messages.po, it should apply the messages-schema schema
        var pof = new POFile({
            project: p,
            pathName: "i18n/deep.po",
            type: t
        });
        test.ok(pof);

        test.throws(function(test) {
            // that's not a po file!
            pof.parse(
               '{\n' +
               '    "x": {\n' +
               '        "y": {,@#\n' +
               '            "plurals": {\n' +
               '                "bar": {\n' +
               '                    "one": "singular",\n' +
               '                    "many": "many",\n' +
               '                    "other": "plural"\n' +
               '                 }\n' +
               '            }\n' +
               '        }\n' +
               '    },\n' +
               '    "a": {\n' +
               '        "b": {\n' +
               '            "strings": {\n' +
               '                "a": "b",\n' +
               '                "c": "d"\n' +
               '            }\n' +
               '        }\n' +
               '    }\n' +
               '}\n');
        });

        test.done();
    },

    testPOFileParseExtractComments: function(test) {
        test.expect(9);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            '# translator\'s comments\n' +
            '#: src/foo.html:32\n' +
            '#. This is comments from the engineer to the translator for string 1.\n' +
            '#, c-format\n' +
            '#| str 1\n' +
            'msgid "string 1"\n' +
            'msgstr ""\n' +
            '\n' +
            '# translator\'s comments 2\n' +
            '#: src/bar.html:644\n' +
            '#. This is comments from the engineer to the translator for string 2.\n' +
            '#, javascript-format,gcc-internal-format\n' +
            '#| str 2\n' +
            'msgid "string 2"\n' +
            'msgstr ""\n'
        );

        var set = pof.getTranslationSet();
        test.ok(set);

        test.equal(set.size(), 2);
        var resources = set.getAll();
        test.equal(resources.length, 2);

        test.equal(resources[0].getSource(), "this is string one");
        test.equal(resources[0].getKey(), "string 1");
        test.equal(resources[0].getNote(),
            '{"translators":"translator\'s comments",' +
             '"extracted":"This is comments from the engineer to the translator for string 1.",' +
             '"flags":"c-format",' +
             '"previous":"str 1"}');
        test.equal(resources[0].getOriginal(), "src/foo.html:32");

        test.equal(resources[1].getSource(), "this is string two");
        test.equal(resources[1].getKey(), "string 2");
        test.equal(resources[1].getNote(), 
            '{"translators":"translator\'s comments 2",' +
             '"extracted":"This is comments from the engineer to the translator for string 2.",' +
             '"flags":"javascript-format,gcc-internal-format",' +
             '"previous":"str 2"}');
        test.equal(resources[1].getOriginal(), "src/bar.html:644");

        test.done();
    },

    testPOFileExtractFile: function(test) {
        test.expect(28);

        var base = path.dirname(module.id);

        var pof = new POFile({
            project: p,
            pathName: "./po/messages.po",
            type: t
        });
        test.ok(pof);

        // should read the file
        pof.extract();

        var set = pof.getTranslationSet();

        test.equal(set.size(), 4);

        var resources = set.getAll();
        test.equal(resources.length, 4);

        test.equal(resources[0].getType(), "string");
        test.equal(resources[0].getSource(), "string 1");
        test.equal(resources[0].getKey(), "string 1");

        test.equal(resources[1].getType(), "plural");
        var categories = resources[1].getSourcePlurals();
        test.ok(categories);
        test.equal(categories.one, "one string");
        test.equal(categories.other, "{$count} strings");
        test.equal(resources[1].getKey(), "one string");

        test.equal(resources[2].getType(), "string");
        test.equal(resources[2].getSource(), "string 2");
        test.equal(resources[2].getKey(), "string 2");

        test.equal(resources[3].getType(), "string");
        test.equal(resources[3].getSource(), "string 3 and 4");
        test.equal(resources[3].getKey(), "string 3 and 4");

        test.done();
    },

    testPOFileExtractUndefinedFile: function(test) {
        test.expect(2);

        var base = path.dirname(module.id);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        // should attempt to read the file and not fail
        pof.extract();

        var set = pof.getTranslationSet();

        test.equal(set.size(), 0);

        test.done();
    },

    testPOFileExtractBogusFile: function(test) {
        test.expect(2);

        var base = path.dirname(module.id);

        var pof = new POFile({
            project: p,
            pathName: "./po/bogus.po",
            type: t
        });
        test.ok(pof);

        // should attempt to read the file and not fail
        pof.extract();

        var set = pof.getTranslationSet();

        test.equal(set.size(), 0);

        test.done();
    },

    testPOFileLocalizeTextSimple: function(test) {
        test.expect(2);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            'msgstr ""\n' +
            '\n' +
            'msgid "string 2"\n' +
            'msgstr ""\n'
        );

        var translations = new TranslationSet();
        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            sourceLocale: "en-US",
            target: "chaîne numéro 1",
            targetLocale: "fr-FR",
            datatype: "po"
        }));

        var actual = pof.localizeText(translations, "fr-FR");
        var expected =
            'msgid "string 1"\n' +
            'msgstr "chaîne numéro 1"\n' +
            '\n' +
            'msgid "string 2"\n' +
            'msgstr ""\n';

        diff(actual, expected);
        test.equal(actual, expected);
        test.done();
    },

    testPOFileLocalizeTextMultiple: function(test) {
        test.expect(2);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            'msgstr ""\n' +
            '\n' +
            'msgid "string 2"\n' +
            'msgstr ""\n'
        );

        var translations = new TranslationSet();
        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            sourceLocale: "en-US",
            target: "chaîne numéro 1",
            targetLocale: "fr-FR",
            datatype: "po"
        }));
        translations.add(new ResourceString({
            project: "foo",
            key: "string 2",
            source: "string 2",
            sourceLocale: "en-US",
            target: "chaîne numéro 2",
            targetLocale: "fr-FR",
            datatype: "po"
        }));

        var actual = pof.localizeText(translations, "fr-FR");
        var expected =
            'msgid "string 1"\n' +
            'msgstr "chaîne numéro 1"\n' +
            '\n' +
            'msgid "string 2"\n' +
            'msgstr "chaîne numéro 2"\n';

        diff(actual, expected);
        test.equal(actual, expected);
        test.done();
    },

    testPOFileLocalizeTextPreserveComments: function(test) {
        test.expect(2);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            'msgstr ""\n' +
            '\n' +
            '# note for translators\n' +
            '#: src/a/b/c.js:32\n' +
            '#. extracted comment\n' +
            '#, c-format\n' +
            'msgid "string 2"\n' +
            'msgstr ""\n'
        );

        var translations = new TranslationSet();
        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            sourceLocale: "en-US",
            target: "chaîne numéro 1",
            targetLocale: "fr-FR",
            datatype: "po"
        }));
        translations.add(new ResourceString({
            project: "foo",
            key: "string 2",
            source: "string 2",
            sourceLocale: "en-US",
            target: "chaîne numéro 2",
            targetLocale: "fr-FR",
            datatype: "po"
        }));

        var actual = pof.localizeText(translations, "fr-FR");
        var expected =
            'msgid "string 1"\n' +
            'msgstr "chaîne numéro 1"\n' +
            '\n' +
            '# note for translators\n' +
            '#: src/a/b/c.js:32\n' +
            '#. extracted comment\n' +
            '#, c-format\n' +
            'msgid "string 2"\n' +
            'msgstr "chaîne numéro 2"\n';

        diff(actual, expected);
        test.equal(actual, expected);
        test.done();
    },

    testPOFileLocalizeTextWithContext: function(test) {
        test.expect(2);

        var pof = new POFile({
            project: p,
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            'msgctxt "context 1"\n' +
            'msgstr ""\n' +
            '\n' +
            'msgid "string 1"\n' +
            'msgctxt "context 2"\n' +
            'msgstr ""\n'
        );

        var translations = new TranslationSet();
        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            context: "context 1",
            sourceLocale: "en-US",
            target: "chaîne numéro 1 contexte 1",
            targetLocale: "fr-FR",
            datatype: "po"
        }));
        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            context: "context 2",
            sourceLocale: "en-US",
            target: "chaîne numéro 2 contexte 2",
            targetLocale: "fr-FR",
            datatype: "po"
        }));

        var actual = pof.localizeText(translations, "fr-FR");
        var expected =
            'msgid "string 1"\n' +
            'msgctxt "context 1"\n' +
            'msgstr "chaîne numéro 1 contexte 1"\n' +
            '\n' +
            'msgid "string 1"\n' +
            'msgctxt "context 2"\n' +
            'msgstr "chaîne numéro 2 contexte 2"\n';

        diff(actual, expected);
        test.equal(actual, expected);
        test.done();
    },

    testPOFileLocalize: function(test) {
        test.expect(7);

        var base = path.dirname(module.id);

        if (fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/fr-FR.po"));
        }
        if (fs.existsSync(path.join(base, "testfiles/resources/de-DE.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/de-DE.po"));
        }

        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po")));
        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/de-DE.po")));

        var pof = new POFile({
            project: p,
            pathName: "./po/messages.po",
            type: t
        });
        test.ok(pof);

        // should read the file
        pof.extract();

        var translations = new TranslationSet();
        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            sourceLocale: "en-US",
            target: "chaîne 1",
            targetLocale: "fr-FR",
            datatype: "po"
        }));
        translations.add(new ResourceString({
            project: "foo",
            key: "string 2",
            source: "d",
            sourceLocale: "en-US",
            target: "chaîne 2",
            targetLocale: "fr-FR",
            datatype: "po"
        }));
        translations.add(new ResourcePlural({
            project: "foo",
            key: "plurals/bar",
            sourceStrings: {
                "one": "string one",
                "other": "{$count} strings"
            },
            sourceLocale: "en-US",
            targetStrings: {
                "one": "chaîne un",
                "other": "chaîne {$count}"
            },
            targetLocale: "fr-FR",
            datatype: "po"
        }));
        translations.add(new ResourceString({
            project: "foo",
            key: "string 3 and 4",
            source: "d",
            sourceLocale: "en-US",
            target: "chaîne 3 et 4",
            targetLocale: "fr-FR",
            datatype: "po"
        }));

        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            sourceLocale: "en-US",
            target: "Zeichenfolge 1",
            targetLocale: "de-DE",
            datatype: "po"
        }));
        translations.add(new ResourceString({
            project: "foo",
            key: "string 2",
            source: "d",
            sourceLocale: "en-US",
            target: "Zeichenfolge 2",
            targetLocale: "de-DE",
            datatype: "po"
        }));
        translations.add(new ResourcePlural({
            project: "foo",
            key: "plurals/bar",
            sourceStrings: {
                "one": "string one",
                "other": "{$count} strings"
            },
            sourceLocale: "en-US",
            targetStrings: {
                "one": "Zeichenfolge un",
                "other": "Zeichenfolge {$count}"
            },
            targetLocale: "de-DE",
            datatype: "po"
        }));
        translations.add(new ResourceString({
            project: "foo",
            key: "string 3 and 4",
            source: "d",
            sourceLocale: "en-US",
            target: "Zeichenfolge 3 und 4",
            targetLocale: "de-DE",
            datatype: "po"
        }));

        pof.localize(translations, ["fr-FR", "de-DE"]);

        test.ok(fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po")));
        test.ok(fs.existsSync(path.join(base, "testfiles/resources/de-DE.po")));

        var content = fs.readFileSync(path.join(base, "testfiles/resources/fr-FR.po"), "utf-8");

        var expected =
            '#: a/b/c.js:32\n' +
            'msgid "string 1"\n' +
            'msgstr "chaîne 1"\n' +
            '\n' +
            '# a plural string\n' +
            'msgid "one string"\n' +
            'msgid_plural "{$count} strings"\n' +
            'msgstr[0] "chaîne un"\n' +
            'msgstr[1] "chaîne {$count}"\n' +
            '\n' +
            '# another string\n' +
            'msgid "string 2"\n' +
            'msgstr "chaîne 2"\n' +
            '\n' +
            '# string with continuation\n' +
            'msgid "string 3 and 4"\n' +
            'msgstr "chaîne 3 et 4"\n';

        diff(content, expected);
        test.equal(content, expected);

        content = fs.readFileSync(path.join(base, "testfiles/resources/de-DE.po"), "utf-8");

        var expected =
            '#: a/b/c.js:32\n' +
            'msgid "string 1"\n' +
            'msgstr "Zeichenfolge 1"\n' +
            '\n' +
            '# a plural string\n' +
            'msgid "one string"\n' +
            'msgid_plural "{$count} strings"\n' +
            'msgstr[0] "Zeichenfolge un"\n' +
            'msgstr[1] "Zeichenfolge {$count}"\n' +
            '\n' +
            '# another string\n' +
            'msgid "string 2"\n' +
            'msgstr "Zeichenfolge 2"\n' +
            '\n' +
            '# string with continuation\n' +
            'msgid "string 3 and 4"\n' +
            'msgstr "Zeichenfolge 3 und 4"\n';

        diff(content, expected);
        test.equal(content, expected);

        test.done();
    },

    testPOFileLocalizeNoTranslations: function(test) {
        test.expect(5);

        var base = path.dirname(module.id);

        if (fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/fr-FR.po"));
        }
        if (fs.existsSync(path.join(base, "testfiles/resources/de-DE.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/de-DE.po"));
        }

        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po")));
        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/de-DE.po")));

        var pof = new POFile({
            project: p,
            pathName: "./po/messages.po",
            type: t
        });
        test.ok(pof);

        // should read the file
        pof.extract();

        var translations = new TranslationSet();

        pof.localize(translations, ["fr-FR", "de-DE"]);

        // should produce the files, even if there is nothing to localize in them
        test.ok(fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po")));
        test.ok(fs.existsSync(path.join(base, "testfiles/resources/de-DE.po")));

        test.done();
    },

    testPOFileLocalizeExtractNewStrings: function(test) {
        test.expect(34);

        var base = path.dirname(module.id);

        if (fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/fr-FR.po"));
        }
        if (fs.existsSync(path.join(base, "testfiles/resources/de-DE.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/de-DE.po"));
        }

        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po")));
        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/de-DE.po")));

        var pof = new POFile({
            project: p,
            pathName: "./po/messages.po",
            type: t
        });
        test.ok(pof);

        // make sure we start off with no new strings
        t.newres.clear();
        test.equal(t.newres.size(), 0);

        // should read the file
        pof.extract();

        // only translate some of the strings
        var translations = new TranslationSet();
        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            sourceLocale: "en-US",
            target: "chaîne 1",
            targetLocale: "fr-FR",
            datatype: "po"
        }));
        translations.add(new ResourcePlural({
            project: "foo",
            key: "plurals/bar",
            sourceStrings: {
                "one": "string one",
                "other": "{$count} strings"
            },
            sourceLocale: "en-US",
            targetStrings: {
                "one": "chaîne un",
                "other": "chaîne {$count}"
            },
            targetLocale: "fr-FR",
            datatype: "po"
        }));

        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            sourceLocale: "en-US",
            target: "Zeichenfolge 1",
            targetLocale: "de-DE",
            datatype: "po"
        }));
        translations.add(new ResourcePlural({
            project: "foo",
            key: "plurals/bar",
            sourceStrings: {
                "one": "string one",
                "other": "{$count} strings"
            },
            sourceLocale: "en-US",
            targetStrings: {
                "one": "Zeichenfolge un",
                "other": "Zeichenfolge {$count}"
            },
            targetLocale: "de-DE",
            datatype: "po"
        }));

        pof.localize(translations, ["fr-FR", "de-DE"]);

        test.ok(fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po")));
        test.ok(fs.existsSync(path.join(base, "testfiles/resources/de-DE.po")));

        // now verify that the strings which did not have translations show up in the
        // new strings translation set
        test.equal(t.newres.size(), 4);
        var resources = t.newres.getAll();
        test.equal(resources.length, 4);

        test.equal(resources[0].getType(), "string");
        test.equal(resources[0].getKey(), "string 2");
        test.equal(resources[0].getTargetLocale(), "fr-FR");

        test.equal(resources[1].getType(), "string");
        test.equal(resources[1].getKey(), "string 3 and 4");
        test.equal(resources[1].getTargetLocale(), "fr-FR");

        test.equal(resources[2].getType(), "string");
        test.equal(resources[2].getKey(), "string 2");
        test.equal(resources[2].getTargetLocale(), "de-DE");

        test.equal(resources[3].getType(), "string");
        test.equal(resources[3].getKey(), "string 3 and 4");
        test.equal(resources[3].getTargetLocale(), "de-DE");

        test.done();
    },

    testPOFileLocalizeWithAlternateFileNameTemplate: function(test) {
        test.expect(5);

        var base = path.dirname(module.id);

        if (fs.existsSync(path.join(base, "testfiles/resources/template_fr-FR.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/template_fr-FR.po"));
        }
        if (fs.existsSync(path.join(base, "testfiles/resources/template_de-DE.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/template_de-DE.po"));
        }

        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/template_fr-FR.po")));
        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/template_de-DE.po")));

        var pof = new POFile({
            project: p,
            pathName: "./po/template.po",
            type: t
        });
        test.ok(pof);

        // should read the file
        pof.extract();

        // only translate some of the strings
        var translations = new TranslationSet();

        pof.localize(translations, ["fr-FR", "de-DE"]);

        test.ok(fs.existsSync(path.join(base, "testfiles/resources/template_fr-FR.po")));
        test.ok(fs.existsSync(path.join(base, "testfiles/resources/template_de-DE.po")));

        test.done();
    },

    testPOFileLocalizeDefaultTemplate: function(test) {
        test.expect(4);

        var base = path.dirname(module.id);

        var pof = new POFile({
            project: p,
            pathName: "x/y/str.po",
            type: t
        });
        test.ok(pof);

        pof.parse(
            'msgid "string 1"\n' +
            '\n' +
            'msgid "string 2"\n'
        );

        var translations = new TranslationSet();
        translations.add(new ResourceString({
            project: "foo",
            key: "string 1",
            source: "string 1",
            sourceLocale: "en-US",
            target: "C'est la chaîne numéro 1",
            targetLocale: "fr-FR",
            datatype: "po"
        }));

        // default template is resources/[localeDir]/[filename]
        if (fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po"))) {
            fs.unlinkSync(path.join(base, "testfiles/resources/fr-FR.po"));
        }

        test.ok(!fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po")));

        pof.localize(translations, ["fr-FR"]);

        test.ok(fs.existsSync(path.join(base, "testfiles/resources/fr-FR.po")));

        var content = fs.readFileSync(path.join(base, "testfiles/resources/fr-FR.po"), "utf-8");

        var expected =
            'msgid "string 1"\n' +
            'msgstr "C\'est la chaîne numéro 1"\n' +
            '\n' +
            'msgid "string 2"\n';

        diff(content, expected);
        test.equal(content, expected);

        test.done();
    }
};