// CVN-Nuvio BR — prioriza vídeos identificados como áudio em português.
// Importante: o Internet Archive nem sempre informa o idioma real da faixa de áudio.
// Para evitar abrir versões claramente sem indicação de português, só retornamos
// itens cujo idioma do conteúdo ou nome do arquivo indique português.
function getStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId || mediaType !== "movie") return Promise.resolve([]);

  function hasPortuguese(value) {
    var s = Array.isArray(value) ? value.join(" ").toLowerCase() : String(value || "").toLowerCase();
    return /(^|[\s._-])(pt-br|pt|por|pob|portuguese|portugu[eê]s|brazilian|brasileir[oa]|dublado|dub)([\s._-]|$)/i.test(s) ||
      /portugu[eê]s do brasil|brazilian portuguese/i.test(s);
  }

  function encodedFileUrl(identifier, filename) {
    return "https://archive.org/download/" + encodeURIComponent(identifier) + "/" +
      filename.split("/").map(encodeURIComponent).join("/");
  }

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
        "&fl[]=identifier&fl[]=title&rows=20&page=1&output=json";
      return fetch(searchUrl)
        .then(function (r) {
          if (!r.ok) throw new Error("Falha na busca do Internet Archive");
          return r.json();
        })
        .then(function (data) {
          var docs = data && data.response && data.response.docs ? data.response.docs : [];
          return Promise.all(docs.slice(0, 15).map(function (doc) {
            return fetch("https://archive.org/metadata/" + encodeURIComponent(doc.identifier))
              .then(function (r) { if (!r.ok) return null; return r.json(); })
              .then(function (meta) {
                if (!meta) return null;
                var files = meta.files || [];
                var metadata = meta.metadata || {};
                var itemLanguage = metadata.language || metadata.languages || "";
                var languageEvidence = hasPortuguese(itemLanguage) ||
                  hasPortuguese(doc.title) || hasPortuguese(doc.identifier);

                var videos = files.filter(function (file) {
                  return /\.(mp4|m4v|webm)$/i.test(file.name || "") &&
                    file.source !== "derivative";
                });
                if (!videos.length) return null;

                // Se o nome do vídeo identifica português, preferimos esse arquivo.
                var portugueseVideo = videos.find(function (file) {
                  return hasPortuguese(file.name);
                });
                var video = portugueseVideo || videos[0];

                // Não devolve versões sem qualquer indicação de português.
                // A indicação é uma pista da fonte, não garantia de dublagem.
                if (!languageEvidence && !portugueseVideo) return null;

                var subtitles = files.filter(function (file) {
                  return /\.(srt|vtt|ass|ssa)$/i.test(file.name || "");
                }).map(function (file) {
                  var isPt = hasPortuguese(file.name);
                  return {
                    url: encodedFileUrl(doc.identifier, file.name),
                    language: isPt ? "pt" : "en",
                    name: isPt ? "Português (arquivo)" : "Legenda (arquivo)"
                  };
                });

                return {
                  name: "CVN-Nuvio BR",
                  title: (doc.title || title) + " • Internet Archive (idioma indicado: português)",
                  url: encodedFileUrl(doc.identifier, video.name),
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
