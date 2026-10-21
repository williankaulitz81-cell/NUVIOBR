// Nuvio BR — Internet Archive public-domain/authorized media search
// Only returns files published through Internet Archive. Audio language depends on the source.
function getStreams(tmdbId, mediaType, season, episode) {
  var settings = globalThis.SCRAPER_SETTINGS || {};
  var apiKey = (settings.tmdbApiKey || "").trim();
  if (!apiKey || mediaType !== "movie") return Promise.resolve([]);

  return fetch("https://api.themoviedb.org/3/movie/" + encodeURIComponent(tmdbId) + "?api_key=" + encodeURIComponent(apiKey) + "&language=pt-BR")
    .then(function (r) { if (!r.ok) throw new Error("TMDB request failed"); return r.json(); })
    .then(function (movie) {
      var title = movie && movie.title;
      if (!title) return [];
      var q = 'title:("' + title.replace(/["\\]/g, " ") + '") AND mediatype:movies';
      var searchUrl = "https://archive.org/advancedsearch.php?q=" + encodeURIComponent(q) +
        "&fl[]=identifier&fl[]=title&rows=8&page=1&output=json";
      return fetch(searchUrl).then(function (r) {
        if (!r.ok) throw new Error("Internet Archive search failed");
        return r.json();
      }).then(function (data) {
        var docs = data && data.response && data.response.docs ? data.response.docs : [];
        return Promise.all(docs.slice(0, 6).map(function (doc) {
          return fetch("https://archive.org/metadata/" + encodeURIComponent(doc.identifier))
            .then(function (r) { if (!r.ok) return null; return r.json(); })
            .then(function (meta) {
              var files = meta && meta.files ? meta.files : [];
              var video = files.find(function (f) {
                var name = (f.name || "").toLowerCase();
                return /\.(mp4|m4v|webm)$/.test(name) && !(f.source === "derivative");
              });
              if (!video) return null;
              var subs = files.filter(function (f) {
                return /\.(srt|vtt|ass|ssa)$/.test((f.name || "").toLowerCase());
              }).map(function (f) {
                var n = (f.name || "").toLowerCase();
                var pt = /(^|[._-])(pt|por|pob|pt-br|brazilian|portuguese)([._-]|$)/.test(n);
                return {
                  url: "https://archive.org/download/" + encodeURIComponent(doc.identifier) + "/" + f.name.split("/").map(encodeURIComponent).join("/"),
                  language: pt ? "pt" : "en",
                  name: pt ? "Português (arquivo)" : "Legenda (arquivo)"
                };
              });
              var url = "https://archive.org/download/" + encodeURIComponent(doc.identifier) + "/" +
                video.name.split("/").map(encodeURIComponent).join("/");
              return {
                name: "Nuvio BR • Internet Archive",
                title: (doc.title || title) + " • arquivo público",
                url: url,
                quality: video.height ? String(video.height) + "p" : "Arquivo",
                subtitles: subs
              };
            }).catch(function () { return null; });
        })).then(function (items) { return items.filter(Boolean); });
      });
    }).catch(function (e) {
      console.log("[Nuvio BR] " + (e && e.message ? e.message : "erro ao buscar"));
      return [];
    });
}

function onSettings() {
  return [
    { type: "header", label: "Configuração" },
    { type: "info", label: "Insira sua chave pessoal da API do TMDB. Este fornecedor procura apenas arquivos no Internet Archive; não garante dublagem PT-BR." },
    { type: "text", key: "tmdbApiKey", label: "Chave da API TMDB", placeholder: "Cole sua chave API", isPassword: true }
  ];
}

module.exports = { getStreams: getStreams, onSettings: onSettings };
