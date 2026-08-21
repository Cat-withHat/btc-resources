(function () {
  "use strict";

  var FRONT_PAGE_ARTICLE_LIMIT = 3;
  var FLAG_FIELDS = [
    "frontpage",
    "front_page",
    "frontPage",
    "featured",
    "promoted",
    "homepage",
    "home_page",
    "homePage",
    "pinned"
  ];
  var TIMESTAMP_FIELDS = [
    "frontpage_at",
    "front_page_at",
    "frontPageAt",
    "featured_at",
    "featuredAt",
    "promoted_at",
    "promotedAt",
    "homepage_at",
    "home_page_at",
    "homePageAt",
    "pinned_at",
    "pinnedAt"
  ];

  window.frontPageArticleItems = [];

  function getSectionNode() {
    return document.getElementById("frontpage-articles-section");
  }

  function setCount(count) {
    var countNode = document.getElementById("frontpage-article-count");
    if (countNode) {
      countNode.textContent = String(count);
    }
  }

  function hideSection() {
    var sectionNode = getSectionNode();
    if (sectionNode) {
      sectionNode.classList.add("hidden");
    }
  }

  function showSection() {
    var sectionNode = getSectionNode();
    if (sectionNode) {
      sectionNode.classList.remove("hidden");
    }
  }

  function syncFetchJson(url) {
    var request = new XMLHttpRequest();
    request.open("GET", url, false);
    request.send(null);

    if (request.status < 200 || request.status >= 300) {
      throw new Error("status=" + request.status);
    }

    return JSON.parse(request.responseText);
  }

  function deriveArticleId(fallbackId, filename) {
    var id = String(fallbackId || "").trim();
    if (id) {
      return id;
    }

    var cleanFile = String(filename || "").trim().replace(/\\/g, "/");
    if (!cleanFile) {
      return "";
    }

    var fileName = cleanFile.split("/").pop() || "";
    return fileName.replace(/\.json$/i, "").trim();
  }

  function cloneMetadata(source) {
    var metadata = {};
    if (!source || typeof source !== "object") {
      return metadata;
    }

    Object.keys(source).forEach(function (key) {
      metadata[key] = source[key];
    });

    return metadata;
  }

  function metadataForRootFrontPageEntry(value) {
    if (value == null || value === false) {
      return {};
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      var metadata = cloneMetadata(value);
      metadata.frontpage = true;
      return metadata;
    }

    return {
      frontpage: true,
      promoted_at: typeof value === "string" ? value : ""
    };
  }

  function getRootFrontPageMetadata(manifest, articleId) {
    var metadata = {};
    var rootFields = ["frontpage", "front_page", "featured", "promoted", "homepage", "home_page"];

    if (!manifest || !articleId) {
      return metadata;
    }

    for (var i = 0; i < rootFields.length; i++) {
      var source = manifest[rootFields[i]];
      if (!source) {
        continue;
      }

      if (String(source || "").trim() === articleId) {
        metadata.frontpage = true;
        continue;
      }

      if (Array.isArray(source)) {
        for (var j = 0; j < source.length; j++) {
          var item = source[j];
          if (String(item || "").trim() === articleId) {
            metadata.frontpage = true;
          } else if (item && typeof item === "object") {
            var itemId = deriveArticleId(item.id, item.filename);
            if (itemId === articleId) {
              var itemMetadata = metadataForRootFrontPageEntry(item);
              Object.keys(itemMetadata).forEach(function (key) {
                metadata[key] = itemMetadata[key];
              });
            }
          }
        }
        continue;
      }

      if (source && typeof source === "object") {
        var rootValue = source[articleId];
        var rootMetadata = metadataForRootFrontPageEntry(rootValue);
        Object.keys(rootMetadata).forEach(function (key) {
          metadata[key] = rootMetadata[key];
        });
      }
    }

    return metadata;
  }

  function normalizeManifestEntries(manifest) {
    var entries = [];
    var source = manifest && manifest.articles;

    if (!source || typeof source !== "object") {
      return entries;
    }

    if (Array.isArray(source)) {
      source.forEach(function (item) {
        if (!item || typeof item !== "object") {
          return;
        }

        var id = deriveArticleId(item.id, item.filename);
        var filename = String(item.filename || "").trim();
        if (!id || !filename) {
          return;
        }

        var metadata = cloneMetadata(item);
        var rootMetadata = getRootFrontPageMetadata(manifest, id);
        Object.keys(rootMetadata).forEach(function (key) {
          metadata[key] = rootMetadata[key];
        });

        entries.push({
          id: id,
          filename: filename,
          timestamp: String(item.timestamp || "").trim(),
          metadata: metadata
        });
      });
      return entries;
    }

    Object.keys(source).forEach(function (idKey) {
      var item = source[idKey];
      if (!item || typeof item !== "object") {
        return;
      }

      var id = deriveArticleId(idKey, item.filename);
      var filename = String(item.filename || "").trim();
      if (!id || !filename) {
        return;
      }

      var metadata = cloneMetadata(item);
      var rootMetadata = getRootFrontPageMetadata(manifest, id);
      Object.keys(rootMetadata).forEach(function (key) {
        metadata[key] = rootMetadata[key];
      });

      entries.push({
        id: id,
        filename: filename,
        timestamp: String(item.timestamp || "").trim(),
        metadata: metadata
      });
    });

    return entries;
  }

  function parseTimestamp(value) {
    if (value == null) {
      return 0;
    }

    var date = new Date(value);
    var timestamp = date.getTime();
    return isNaN(timestamp) ? 0 : timestamp;
  }

  function isTruthyFlag(value) {
    if (value === true || value === 1) {
      return true;
    }

    if (value === false || value === 0 || value == null) {
      return false;
    }

    var normalized = String(value).trim().toLowerCase();
    return normalized === "true"
      || normalized === "1"
      || normalized === "yes"
      || normalized === "y"
      || normalized === "on"
      || normalized === "frontpage"
      || normalized === "promoted"
      || normalized === "featured";
  }

  function hasFrontPageSignal(article, entry) {
    var sources = [article || {}, (entry && entry.metadata) || entry || {}];

    for (var i = 0; i < sources.length; i++) {
      for (var j = 0; j < FLAG_FIELDS.length; j++) {
        if (isTruthyFlag(sources[i][FLAG_FIELDS[j]])) {
          return true;
        }
      }

      for (var k = 0; k < TIMESTAMP_FIELDS.length; k++) {
        if (parseTimestamp(sources[i][TIMESTAMP_FIELDS[k]]) > 0) {
          return true;
        }
      }
    }

    return false;
  }

  function getFrontPageTimestamp(article, entry) {
    var sources = [article || {}, (entry && entry.metadata) || entry || {}];

    for (var i = 0; i < sources.length; i++) {
      for (var j = 0; j < TIMESTAMP_FIELDS.length; j++) {
        var timestamp = parseTimestamp(sources[i][TIMESTAMP_FIELDS[j]]);
        if (timestamp > 0) {
          return timestamp;
        }
      }
    }

    return parseTimestamp(article && article.article_time) || parseTimestamp(entry && entry.timestamp);
  }

  function getFrontPageLimit() {
    var sectionNode = getSectionNode();
    var configuredLimit = parseInt(sectionNode && sectionNode.getAttribute("data-article-limit"), 10);
    return configuredLimit > 0 ? configuredLimit : FRONT_PAGE_ARTICLE_LIMIT;
  }

  function loadFrontPageItemsSync(utils, subdirectory) {
    var manifest = syncFetchJson(utils.ARTICLE_MANIFEST_URL);
    var entries = normalizeManifestEntries(manifest);
    var items = [];
    var byId = {};

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var sourceUrl = utils.buildRawArticleFileUrl(entry.filename);
      if (!sourceUrl) {
        continue;
      }

      try {
        var articleJson = syncFetchJson(sourceUrl);
        if (!hasFrontPageSignal(articleJson, entry)) {
          continue;
        }

        var model = utils.buildArticleFeedModel(articleJson, entry.id, subdirectory);
        if (!model || !model.id || !utils.isValidUuid(model.id) || byId[model.id]) {
          continue;
        }

        model.frontPageTimestamp = getFrontPageTimestamp(articleJson, entry);
        byId[model.id] = true;
        items.push(model);
      } catch (error) {
      }
    }

    items.sort(function (a, b) {
      return Number(b.frontPageTimestamp || 0) - Number(a.frontPageTimestamp || 0);
    });

    return items.slice(0, getFrontPageLimit());
  }

  function initializeFrontPageArticlesSync() {
    var utils = window.BtcArticleUtils;
    if (!utils || !window.TemplateEngine) {
      hideSection();
      return;
    }

    try {
      var subdirectory = (TemplateEngine.settings && TemplateEngine.settings.SUBDIRECTORY) || "";
      window.frontPageArticleItems = loadFrontPageItemsSync(utils, subdirectory);

      if (!window.frontPageArticleItems.length) {
        hideSection();
        return;
      }

      window.TemplateEngine.ParseAndReplace("{{foreach frontPageArticleItems loadtemplate article-feed-item-template.html at frontpage-article-list callback onFrontPageArticlesRendered}}");
    } catch (error) {
      window.frontPageArticleItems = [];
      hideSection();
    }
  }

  window.onFrontPageArticlesRendered = function () {
    var count = Array.isArray(window.frontPageArticleItems) ? window.frontPageArticleItems.length : 0;
    setCount(count);

    if (!count) {
      hideSection();
      return;
    }

    showSection();
  };

  initializeFrontPageArticlesSync();
})();
