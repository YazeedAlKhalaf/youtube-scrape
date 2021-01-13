const request = require("request");

async function getChannel(channelId, languageCode) {
  return new Promise((resolve, reject) => {
    let json = { results: [], version: require("./package.json").version };

    let url = `https://www.youtube.com/channel/${channelId}/videos`;
    var options = {
      url: url,
      headers: {
        "Accept-Language": languageCode ?? "en-US",
      },
    };
    // Access YouTube channel videos
    request(options, (error, response, html) => {
      // Check for errors
      if (!error && response.statusCode === 200) {
        // Get script json data from html to parse
        let data,
          sectionLists = [];
        try {
          let match = html.match(
            /ytInitialData[^{]*(.*"responseContext":[^;]*});/s
          );
          if (match && match.length > 1) {
            json["parser"] += ".object_var";
          } else {
            json["parser"] += ".original";
            match = html.match(
              /ytInitialData"[^{]*(.*);\s*window\["ytInitialPlayerResponse"\]/s
            );
          }
          data = JSON.parse(match[1]);
          console.log(data);
          json["estimatedResults"] = data.estimatedResults || "0";
          sectionLists =
            data.contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer
              .content.sectionListRenderer.contents;
        } catch (ex) {
          console.error("Failed to parse data:", ex);
          console.log(data);
        }

        // Loop through all objects and parse data according to type
        parseJsonFormat(sectionLists, json);

        return resolve(json);
      }

      resolve({ error: error });
    });
  });
}

/**
 * Parse youtube channel page from json sectionList array and add to json result object
 * @param {Array} contents - The array of sectionLists
 * @param {Object} json - The object being returned to caller
 */
function parseJsonFormat(contents, json) {
  contents.forEach((sectionList) => {
    try {
      if (sectionList.hasOwnProperty("itemSectionRenderer")) {
        sectionList.itemSectionRenderer.contents[0].gridRenderer.items.forEach(
          (content) => {
            try {
              if (content.hasOwnProperty("gridVideoRenderer")) {
                json.results.push(
                  parseGridVideoRenderer(content.gridVideoRenderer)
                );
              }
            } catch (ex) {
              console.error("Failed to parse renderer:", ex);
              console.log(content);
            }
          }
        );
      }
    } catch (ex) {
      console.error("Failed to read contents for section list:", ex);
      console.log(sectionList);
    }
  });
}

/**
 * Parse a gridVideoRenderer object from youtube chanenl page
 * @param {object} renderer - The grid video renderer
 * @returns object with data to return for this video
 */
function parseGridVideoRenderer(renderer) {
  let video = {
    id: renderer.videoId,
    title: renderer.title.runs.reduce(comb, ""),
    url: `https://www.youtube.com${renderer.navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
    duration: renderer.thumbnailOverlays[0][
      "thumbnailOverlayTimeStatusRenderer"
    ]["text"]["simpleText"]
      ? renderer.thumbnailOverlays[0]["thumbnailOverlayTimeStatusRenderer"][
          "text"
        ]["simpleText"]
      : "Live",
    snippet: renderer.descriptionSnippet
      ? renderer.descriptionSnippet.runs.reduce(
          (a, b) => a + (b.bold ? `<b>${b.text}</b>` : b.text),
          ""
        )
      : "",
    upload_date: renderer.publishedTimeText
      ? renderer.publishedTimeText.simpleText
      : "Live",
    thumbnail_src:
      renderer.thumbnail.thumbnails[renderer.thumbnail.thumbnails.length - 1]
        .url,
    views: renderer.viewCountText
      ? renderer.viewCountText.simpleText ||
        renderer.viewCountText.runs.reduce(comb, "")
      : renderer.publishedTimeText
      ? "0 views"
      : "0 watching",
  };

  return { video: video };
}

/**
 * Combine array containing objects in format { text: "string" } to a single string
 * For use with reduce function
 * @param {string} a - Previous value
 * @param {object} b - Current object
 * @returns Previous value concatenated with new object text
 */
function comb(a, b) {
  return a + b.text;
}

module.exports.getChannel = getChannel;
