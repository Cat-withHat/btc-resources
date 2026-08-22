(function () {
  "use strict";

  var FRONT_PAGE_ARTICLE_LIMIT = 3;

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

  function isArticleManifestEntry(value) {
    return !!value
      && typeof value === "object"
      && !Array.isArray(value)
      && typeof value.filename === "string"
      && typeof value.timestamp === "string";
  }

  function normalizeManifestEntries(manifest) {
    if (!manifest || typeof manifest !== "object" || !manifest.articles || typeof manifest.articles !== "object" || Array.isArray(manifest.articles)) {
      return [];
    }

    var entries = [];
    for (var id in manifest.articles) {
      if (!Object.prototype.hasOwnProperty.call(manifest.articles, id)) {
        continue;
      }

      var item = manifest.articles[id];
      if (!isArticleManifestEntry(item)) {
        continue;
      }

      var filename = String(item.filename || "").trim();
      if (!id || !filename) {
        continue;
      }

      entries.push({
        id: String(id || "").trim(),
        filename: filename,
        timestamp: String(item.timestamp || "").trim()
      });
    }

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

  function isFrontPageArticle(article) {
    return !!article && article.frontpage === true;
  }

  function getFrontPageTimestamp(article, entry) {
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
        if (!isFrontPageArticle(articleJson)) {
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
