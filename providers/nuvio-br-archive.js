// CVN-Nuvio BR — busca obras disponíveis publicamente no Internet Archive.
// A disponibilidade e o idioma do áudio dependem dos arquivos publicados na fonte.
function getStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId || mediaType !== "movie") return Promise.resolve([]);

  // Obtém o título pela página pública do TMDB, sem exigir uma chave de API.
  return fetch("https://www.themoviedb.org/movie/" + encodeURIComponent(tmdbId) + "?language=pt-BR")
    .then(function (r) {
      if (!r.ok) throw new Error("Não foi possível consultar a página do TMDB");
      return r.text();
    })
    .then(function (html) {
      var match = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) ||
                  html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (!match || !match[1]) return "";
      return match[1].replace(/\s*[|–-]\s*The Movie Database.*$/i, "")
        .replace(/\s*\(\d{4}\)\s*$/, "").trim();
    })
    .then(function (title) {
      if (!title) return [];
      var q = 'title:("' + title.replace(/["\\]/g, " ") + '") AND mediatype:movies';
      var searchUrl = "https://archive.org/advancedsearch.php?q=" + encodeURIComponent(q) +
        "&fl[]=identifier&fl[]=title&rows=8&page=1&output=json";
      return fetch(searchUrl)
        .then(function (r) {
          if (!r.ok) throw new Error("Falha na busca do Internet Archive");
          return r.json();
        })
        .then(function (data) {
          var docs = data && data.response && data.response.docs ? data.response.docs : [];
          return Promise.all(docs.slice(0, 6).map(function (doc) {
            return fetch("https://archive.org/metadata/" + encodeURIComponent(doc.identifier))
              .then(function (r) { if (!r.ok) return null; return r.json(); })
              .then(function (meta) {
                var files = meta && meta.files ? meta.files : [];
                var video = files.find(function (f) {
                  var n = (f.name || "").toLowerCase();
                  return /\.(mp4|m4v|webm)$/.test(n) && f.source !== "derivative";
                });
                if (!video) return null;
                var subtitles = files.filter(function (f) {
                  return /\.(srt|vtt|ass|ssa)$/i.test(f.name || "");
                }).map(function (f) {
                  var n = (f.name || "").toLowerCase();
                  var pt = /(^|[._-])(pt|por|pob|pt-br|brazilian|portuguese)([._-]|$)/.test(n);
                  return {
                    url: "https://archive.org/download/" + encodeURIComponent(doc.identifier) + "/" +
                      f.name.split("/").map(encodeURIComponent).join("/"),
                    language: pt ? "pt" : "en",
                    name: pt ? "Português (arquivo)" : "Legenda (arquivo)"
                  };
                });
                return {
                  name: "CVN-Nuvio BR",
                  title: (doc.title || title) + " • Internet Archive",
                  url: "https://archive.org/download/" + encodeURIComponent(doc.identifier) + "/" +
                    video.name.split("/").map(encodeURIComponent).join("/"),
                  quality: video.height ? String(video.height) + "p" : "Arquivo",
                  subtitles: subtitles
                };
              }).catch(function () { return null; });
          })).then(function (items) { return items.filter(Boolean); });
        });
    })
    .catch(function (e) {
      console.log("[CVN-Nuvio BR] " + (e && e.message ? e.message : "erro ao buscar"));
      return [];
    });
}

if (typeof globalThis !== "undefined") globalThis.getStreams = getStreams;
if (typeof module !== "undefined") module.exports = { getStreams: getStreams };
